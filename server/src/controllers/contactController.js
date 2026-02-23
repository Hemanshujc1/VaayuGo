const nodemailer = require('nodemailer');

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Configure the transporter
    // For production, use SMTP credentials. In development, you could configure this with a test account or real credentials securely via .env
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail', 'sendgrid'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Define email options
    const mailOptions = {
      from: `"${name}" <${email}>`, // sender address
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // list of receivers (send to admin)
      subject: `New Contact Form Submission: ${subject}`, // Subject line
      text: `You have received a new message from ${name} (${email}):\n\n${message}`, // plain text body
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `, // html body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Contact form submitted successfully! We will get back to you soon.' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ success: false, message: 'Failed to submit contact form. Please try again later.' });
  }
};
