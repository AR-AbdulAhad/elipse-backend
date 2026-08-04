const prisma = require('../config/prisma');
const transporter = require('../config/emailConfig');

const updateMeetingStatus = async (req, res) => {
  const { id } = req.params;
  const meetingId = parseInt(id);

  if (isNaN(meetingId)) {
    return res.status(400).json({ message: 'Invalid meeting ID. Must be a number.' });
  }

  console.log('--- START APPROVAL PROCESS ---');
  console.log('Target ID:', meetingId);

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });
    
    if (!meeting) {
      console.log('❌ ERROR: Meeting document not found in DB');
      return res.status(404).json({ message: 'Meeting not found' });
    }

    console.log('✅ Found Meeting:', meeting.email);

    const updatedStatus = req.body.status || 'Approved';
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: updatedStatus }
    });
    console.log('✅ Status updated in Database');

    if (updatedStatus === 'Approved') {
      console.log('📧 Preparing to send email...');
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'devkhalid825@gmail.com',
        to: meeting.email,
        subject: 'Meeting Request Approved - Next Steps',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #00FFFF; background: #000; padding: 15px; text-align: center; border-radius: 5px;">ELIPSE STUDIO</h2>
            <p>Hello,</p>
            <p>Great news! You have been successfully added to our <strong>Join Meeting List</strong>.</p>
            <p>The next step is to schedule your meeting. Please contact us at the number below so we can finalize the date and time:</p>
            <div style="background: #f9f9f9; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <span style="font-size: 18px; font-weight: bold; color: #069297;">Phone/WhatsApp: +92 347 1245257</span>
            </div>
            <p>We look forward to speaking with you soon.</p>
            <p>Best regards,<br><strong>Team Elipse Studio</strong></p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('❌ EMAIL ERROR:', error.message);
        } else {
          console.log('✅ EMAIL SENT Successfully:', info.response);
        }
      });
    }

    console.log('--- END PROCESS: Sending JSON Response ---');
    res.json(updatedMeeting);

  } catch (error) {
    console.error('🔥 CRITICAL ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meetingId = parseInt(id);

    if (isNaN(meetingId)) {
      return res.status(400).json({ message: 'Invalid meeting ID. Must be a number.' });
    }

    await prisma.meeting.delete({
      where: { id: meetingId }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createMeetingRequest = async (req, res) => {
  const { email } = req.body;
  try {
    const meeting = await prisma.meeting.create({
      data: {
        email,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      }
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMeetings = async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createMeetingRequest, getMeetings, updateMeetingStatus, deleteMeeting };
