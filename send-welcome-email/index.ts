// Edge Function (TypeScript/Deno) - Envoi d'e-mail via l'API Resend

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Les clés API et d'envoi sont récupérées des secrets d'environnement Supabase
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// 🚨 REMPLACEZ 'votre-domaine.fr' par un domaine vérifié dans votre compte Resend !
const EMAIL_FROM = 'Focus ISEP <noreply@votre-domaine.fr>';

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    if (!RESEND_API_KEY) {
        return new Response('RESEND_API_KEY not set in Supabase secrets.', { status: 500 });
    }

    try {
        // Le corps de la requête du Webhook Supabase contient l'enregistrement sous 'record'.
        const payload = await req.json();
        // Le webhook envoie l'objet entier, l'enregistrement se trouve sous 'record'
        const user = payload.record; 

        if (!user || !user.email || !user.username) {
             return new Response('Invalid user data received from webhook.', { status: 400 });
        }
        
        const { email, username } = user;

        const emailContentHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: auto; background-color: #ffffff;">
                <h2 style="color: #2c5aa0;">🎉 Bienvenue sur Focus ISEP, ${username} ! 🎉</h2>
                <p>Toute l'équipe vous remercie de vous être inscrit. Vous pouvez désormais accéder à l'intégralité de nos ressources pour optimiser votre réussite académique.</p>
                
                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e0e0e0;">
                
                <h3 style="color: #FF6B35;">🤝 Un projet, une communauté : Aidez-nous à garantir la qualité !</h3>
                
                <p>Focus ISEP est un projet étudiant collaboratif. Nous comptons sur votre vigilance pour maintenir un haut niveau d'excellence :</p>
                <ul style="padding-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Alertez-nous en cas d'erreur :</strong> Si vous trouvez une faute de frappe, une erreur de formule, ou un corrigé incorrect, veuillez nous en informer immédiatement (répondez à cet e-mail ou via le formulaire de contact du site).</li>
                    <li><strong>Respectez les ressources :</strong> Ces outils sont mis à disposition pour votre apprentissage personnel.</li>
                </ul>
                
                <h3 style="color: #4CAF50;">🚀 Voulez-vous rejoindre l'équipe ?</h3>
                
                <p>Si vous souhaitez fournir des ressources (TDs corrigés, fiches, etc.) ou participer au développement, contactez l'administrateur pour rejoindre l'équipe de contributeurs.</p>
                
                <p style="margin-top: 30px;">Bonnes révisions,</p>
                <p>L'équipe Focus ISEP</p>
            </div>
        `;

        // Appel à l'API Resend
        const res = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: EMAIL_FROM,
                to: email, 
                subject: 'Bienvenue sur Focus ISEP ! Votre guide pour l\'excellence académique',
                html: emailContentHtml,
            }),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            console.error('Erreur Resend:', errorBody);
            // Retourner une erreur pour que Supabase sache que l'appel a échoué
            return new Response(`Email service error: ${errorBody}`, { status: 500 }); 
        }

        return new Response('Welcome email successfully dispatched.', { status: 200 });
        
    } catch (error) {
        console.error('Erreur Edge Function:', error.message);
        return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
});
