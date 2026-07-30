const transporter = require('../config/emailConfig');
const prisma = require('../config/prisma');

const sendContactEmail = async (req, res) => {
  const { interest, user_name, user_company, user_email, user_phone, user_source, message } = req.body;

  if (!user_name || !user_email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  try {
    // 1. Save to Database using Prisma
    const newContact = await prisma.contact.create({
      data: {
        interest,
        user_name,
        user_company,
        user_email,
        user_phone,
        user_source,
        message,
        status: 'Pending'
      }
    });

    // 2. Prepare Email
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER || user_email,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: user_email,
      subject: `New Inquiry: ${interest} from ${user_name}`,
      text: `
        NEW CONTACT INQUIRY
        -------------------
        Interest: ${interest}
        Name: ${user_name}
        Company: ${user_company || 'N/A'}
        Email: ${user_email}
        Phone: ${user_phone || 'N/A'}
        Source: ${user_source || 'N/A'}
        
        Message:
        ${message}
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eef2f1;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 50px 30px 50px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em;">ELIPSE</h1>
                            <div style="width: 40px; height: 3px; background-color: #00FFFF; margin-top: 8px;"></div>
                          </td>
                          <td align="right">
                            <span style="font-size: 12px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.1em;">New Inquiry</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Intro -->
                  <tr>
                    <td style="padding: 0 50px 30px 50px;">
                      <p style="margin: 0; font-size: 16px; color: #444; line-height: 1.6;">
                        You have received a new message through the contact form. Here are the details:
                      </p>
                    </td>
                  </tr>

                  <!-- Details Grid -->
                  <tr>
                    <td style="padding: 0 50px 40px 50px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="12" style="background-color: #fbfcfc; border-radius: 16px; border: 1px solid #f0f3f2;">
                        <tr>
                          <td width="35%" style="padding-left: 20px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Interest</td>
                          <td style="font-size: 15px; color: #1a1a1a; font-weight: 500;">${interest}</td>
                        </tr>
                        <tr>
                          <td style="padding-left: 20px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Name</td>
                          <td style="font-size: 15px; color: #1a1a1a; font-weight: 500;">${user_name}</td>
                        </tr>
                        <tr>
                          <td style="padding-left: 20px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Company</td>
                          <td style="font-size: 15px; color: #1a1a1a;">${user_company || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style="padding-left: 20px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
                          <td style="font-size: 15px; color: #007bff;"><a href="mailto:${user_email}" style="color: #007bff; text-decoration: none;">${user_email}</a></td>
                        </tr>
                        <tr>
                          <td style="padding-left: 20px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Phone</td>
                          <td style="font-size: 15px; color: #1a1a1a;">${user_phone || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px; padding-left: 20px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Source</td>
                          <td style="padding-bottom: 20px; font-size: 15px; color: #1a1a1a;">${user_source || 'N/A'}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Message Section -->
                  <tr>
                    <td style="padding: 0 50px 40px 50px;">
                      <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.05em;">Message</h3>
                      <div style="padding: 24px; background-color: #ffffff; border: 1px solid #eef2f1; border-radius: 16px; font-size: 16px; color: #444; line-height: 1.8; white-space: pre-wrap;">${message}</div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 40px 50px; background-color: #1a1a1a; color: #ffffff; text-align: center; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;">
                      <p style="margin: 0; font-size: 14px; opacity: 0.8;">&copy; 2024 ELIPSE. All rights reserved.</p>
                      <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.5;">This inquiry was sent from your website's contact form.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Send auto-reply to the submitter
    try {
      const autoReplyOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: user_email,
        subject: 'Thank you for contacting Elipse Studio',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #eef2f1;">
                    <tr>
                      <td style="padding: 40px 50px 30px 50px;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em;">ELIPSE STUDIO</h1>
                        <div style="width: 40px; height: 3px; background-color: #00FFFF; margin-top: 8px;"></div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 50px 20px 50px;">
                        <p style="margin: 0; font-size: 16px; color: #444; line-height: 1.6;">Dear ${user_name},</p>
                        <p style="font-size: 16px; color: #444; line-height: 1.6;">Thank you for reaching out to Elipse Studio. We have received your inquiry and appreciate your interest in our services.</p>
                        <p style="font-size: 16px; color: #444; line-height: 1.6;">A member of our team will get back to you within <strong>24 hours</strong> to discuss your project requirements.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 50px 20px 50px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.05em;">Your Message</h3>
                        <div style="padding: 20px; background-color: #fbfcfc; border: 1px solid #eef2f1; border-radius: 12px; font-size: 15px; color: #444; line-height: 1.7; white-space: pre-wrap;">${message}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 50px 30px 50px;">
                        <p style="font-size: 16px; color: #444; line-height: 1.6;">Best regards,<br><strong>Team Elipse Studio</strong></p>
                        <p style="font-size: 14px; color: #888; margin-top: 4px;">Elipse Studio — 3D Rendering, Animation &amp; Interactive Experiences</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 50px; background-color: #1a1a1a; color: #ffffff; text-align: center; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;">
                        <p style="margin: 0; font-size: 14px; opacity: 0.8;">&copy; 2024 ELIPSE STUDIO. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.5;">This is an automated response, please do not reply to this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      await transporter.sendMail(autoReplyOptions);
    } catch (autoReplyError) {
      console.error('Auto-reply email failed:', autoReplyError.message);
    }

    res.status(200).json({ success: 'Message sent successfully!', contact: newContact });
  } catch (error) {
    console.error('Error saving contact or sending email:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
};

// Admin Methods
const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const contact = await prisma.contact.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendContactEmail,
  getContacts,
  updateContactStatus,
  deleteContact
};

