const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all templates in the database...");
  const templates = await prisma.template.findMany();

  for (const t of templates) {
    if (!t.html || t.html.trim() === "") {
      console.log(`Template "${t.name}" has empty HTML. Healing...`);
      let customHtml = "";

      if (t.name.toLowerCase().includes("summer")) {
        customHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Summer Offer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Summer Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #FF6B6B 0%, #FFA801 100%); padding: 48px 32px;">
              <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 6px 12px; border-radius: 30px; font-family: monospace;">LIMITED SUMMER DISPATCH</span>
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 16px 0 8px 0; letter-spacing: -1px;">☀️ Special Summer Offer!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0; font-weight: 500;">Exclusive hot discounts tailored just for you</p>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px 32px; background-color: #ffffff;">
              <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 20px 0; font-weight: 500;">Hello <strong>{{first_name}}</strong>,</p>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                The sun is out, and so are our biggest savings of the season! We wanted to reach out to you at <strong>{{email}}</strong> to offer an exclusive **40% Summer Discount** across all our learning tracks and premium toolkits.
              </p>

              <!-- Coupon Highlight Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF9F2; border: 1px dashed #FFA801; border-radius: 8px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #D35400; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">YOUR EXCLUSIVE COUPON</span>
                    <strong style="font-size: 26px; font-weight: 800; color: #FF6B6B; letter-spacing: 1px; font-family: monospace;">SUMMER40</strong>
                    <span style="font-size: 12px; color: #7F8C8D; display: block; margin-top: 4px;">Valid until May 31, 2026</span>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://pulsesend.com" target="_blank" style="background: #7C5CFF; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block; box-shadow: 0 4px 10px rgba(124, 92, 255, 0.3); transition: all 0.2s ease;">Claim Your 40% Discount Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer section with Unsubscribe -->
          <tr>
            <td style="padding: 32px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center;">
              <p style="font-size: 13px; font-weight: 600; color: #64748B; margin: 0 0 8px 0;">PulseSend Platform</p>
              <p style="font-size: 11px; color: #94A3B8; line-height: 1.5; margin: 0 0 16px 0;">
                You are receiving this email because you subscribed to our summer list. If you wish to opt-out, you can safely unsubscribe below.
              </p>
              <a href="https://pulsesend.com/unsubscribe?email={{email}}" target="_blank" style="font-size: 11px; font-weight: 700; color: #7C5CFF; text-decoration: none;">Unsubscribe from this list</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
      } else {
        customHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${t.name}</title>
</head>
<body style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background-color: #F8FAFC;">
  <div style="background: #ffffff; padding: 32px; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
    <h1 style="color: #7C5CFF; margin-top: 0;">${t.name}</h1>
    <p style="font-size: 16px; color: #334155;">Hello <strong>{{first_name}}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">This is your fully compiled campaign template delivered in real-time!</p>
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center;">
      Sent to {{email}} via PulseSend.
    </div>
  </div>
</body>
</html>
        `;
      }

      await prisma.template.update({
        where: { id: t.id },
        data: { html: customHtml }
      });
      console.log(`Successfully healed template "${t.name}"!`);
    } else {
      console.log(`Template "${t.name}" already has valid HTML content.`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
