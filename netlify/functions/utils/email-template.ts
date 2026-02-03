
export const generateEmailHtml = ({
  title,
  content,
  previewText,
}: {
  title: string;
  content: string;
  previewText?: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f6f9fc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        .header {
            background-color: #ffffff;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 3px solid #f0f0f0;
        }
        .header img {
            max-height: 60px;
            width: auto;
        }
        .content {
            padding: 40px;
            line-height: 1.6;
        }
        .content h1 {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 24px;
            text-align: center;
        }
        .content p {
            margin-bottom: 16px;
            font-size: 16px;
            color: #4a4a4a;
        }
        .details-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .details-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .details-list li {
            padding: 8px 0;
            border-bottom: 1px solid #eaeaea;
            display: flex;
            justify-content: space-between;
        }
        .details-list li:last-child {
            border-bottom: none;
        }
        .details-list strong {
            color: #1a1a1a;
            font-weight: 600;
        }
        .details-list span {
            color: #4a4a4a;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px;
            text-align: center;
            font-size: 13px;
            color: #8898aa;
            border-top: 1px solid #eaeaea;
        }
        .footer a {
            color: #8898aa;
            text-decoration: underline;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
            }
            .content {
                padding: 24px !important;
            }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText || title}
    </div>
    <div class="container">
        <div class="header">
            <img src="https://inter-asso.fr/images/clubs/Logo-Inter-Asso.webp" alt="Inter-Asso" />
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p style="margin-bottom: 8px;">
              Une initiative de l'<strong style="font-weight: 600;">INTER-ASSO</strong>, regroupant les BDE :
              <br />
              <span style="display: block; margin-top: 4px; opacity: 0.8;">
                MMI Spark • Alive (Info) • MPintes (MP) • Kart'l (R&T)
              </span>
            </p>
            <p style="margin-bottom: 16px;">
              Avec l'aide de l'association Well'Com
            </p>
            <p>Cet email a été envoyé par INTER-ASSO de Lannion.</p>
            <p><a href="https://inter-asso.fr">Visiter notre site</a></p>
        </div>
    </div>
</body>
</html>
`;
};
