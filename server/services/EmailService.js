const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.from = process.env.EMAIL_FROM || "VaayuGo <noreply@vaayugo.com>";
  }

  /**
   * Send a generic email
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - HTML email body
   */
  async sendEmail(to, subject, html) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("EmailService: SMTP credentials not configured. Skipping email send.", { to, subject });
      return;
    }
    
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === "true" || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      console.log(`Email sent: ${info.messageId} to ${to}`);
      return info;
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error);
    }
  }

  async sendVerificationOtp(to, name, otp) {
    const subject = `${otp} is your VaayuGo verification code`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #03dac6; text-align: center;">Welcome to VaayuGo!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering with VaayuGo. To complete your registration, please use the following one-time password (OTP) to verify your email address:</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background-color: #f4f4f4; padding: 15px 30px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #121212; border: 2px dashed #03dac6;">
            ${otp}
          </div>
        </div>
        
        <p>This code will expire in 10 minutes. If it expires, you can request a new one from the registration page.</p>
        <p>If you did not create an account, please ignore this email.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          Happy Shopping,<br>
          <strong>The VaayuGo Team</strong>
        </p>
      </div>
    `;

    // For development, also log the OTP to console
    console.log(`\n======================================`);
    console.log(`📧 VERIFICATION OTP`);
    console.log(`--------------------------------------`);
    console.log(`User: ${to}`);
    console.log(`OTP:  ${otp}`);
    console.log(`Expiry: 10 Minutes`);
    console.log(`======================================\n`);

    return this.sendEmail(to, subject, html);
  }

  // Phase 3: Customer Notifications
  async sendOrderStatusUpdate(order, customerEmail, newStatus) {
    let statusMessage = "";
    switch (newStatus) {
      case "accepted":
        statusMessage = "has been accepted by the shop and is now being processed.";
        break;
      case "preparing":
        statusMessage = "is currently being prepared.";
        break;
      case "out_for_delivery":
        statusMessage = "is out for delivery! It will reach you soon.";
        break;
      case "delivered":
        statusMessage = "has been delivered successfully. Enjoy!";
        break;
      case "cancelled":
        statusMessage = `has been cancelled. Reason: ${order.cancel_reason || "Not specified"}.`;
        break;
      case "failed":
        statusMessage = `failed to be delivered. Reason: ${order.failure_reason || "Not specified"}.`;
        break;
      default:
        statusMessage = `is now marked as ${newStatus}.`;
    }

    const itemsHtml = (order.OrderItems || []).map(item => 
      `<li>${item.quantity}x ${item.name || "Item"} @ ₹${item.price_at_time || item.price}</li>`
    ).join("");

    const subject = `Order Update: #${order.id} is now ${newStatus.replace("_", " ").toUpperCase()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #03dac6;">VaayuGo - Order Update</h2>
        <p>Hi there,</p>
        <p>Your order <strong>#${order.id}</strong> from <strong>${order.Shop?.name || "the shop"}</strong> ${statusMessage}</p>
        
        <h3>Order Items:</h3>
        <ul>${itemsHtml}</ul>

        <p><strong>Order Total:</strong> ₹${order.grand_total} </p>
        <p>(Incl. all the delivery charges and extra charges)</p>
        <p>Thank you for using VaayuGo!</p> 
      </div>
    `;

    return this.sendEmail(customerEmail, subject, html);
  }

  // Phase 4: Shopkeeper Notifications
  async sendNewOrderAlert(order, shopkeeperEmail) {
    const subject = `New Order Received: #${order.id}`;
    let itemsHtml = "";
    if (order.OrderItems && order.OrderItems.length > 0) {
        itemsHtml = order.OrderItems.map(item => `<li>${item.quantity}x ${item.name || "Item"} @ ₹${item.price_at_time}</li>`).join("");
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #03dac6;">VaayuGo - New Order!</h2>
        <p>Hi Shopkeeper,</p>
        <p>You just received a new order <strong>#${order.id}</strong>.</p>
        
        <h3>Order Details:</h3>
        <ul>${itemsHtml}</ul>
        <p><strong>Grand Total:</strong> ₹${order.grand_total} </p>
        <p>(Incl. all the delivery charges and extra charges)</p>
        <p><strong>Customer Name:</strong> ${order.User?.name || "Customer"}</p>
        <p><strong>Phone:</strong> ${order.User?.mobile_number || order.User?.phone || "N/A"}</p>
        
        <p>Please check your dashboard to accept and process this order.</p>
      </div>
    `;

    return this.sendEmail(shopkeeperEmail, subject, html);
  }

  async sendOrderCancelledAlert(order, shopkeeperEmail) {
    const subject = `Order Cancelled: #${order.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #cf6679;">VaayuGo - Order Cancelled</h2>
        <p>Hi Shopkeeper,</p>
        <p>Order <strong>#${order.id}</strong> has been cancelled by the customer.</p>
        <p>
        <h3>Reason:</h3>
        <div style="background-color: #f8dbdf; padding: 15px; border-left: 4px solid #cf6679; border-radius: 4px; margin-bottom: 20px;">
            ${order.cancel_reason || "No explicit reason provided."}
        </div>
        </p>
        
        <p><strong>Grand Total:</strong> ₹${order.grand_total} </p>
        <p>(Incl. all the delivery charges and extra charges)</p>
        <p><strong>Customer Name:</strong> ${order.User?.name || "Customer"}</p>
        <p><strong>Phone:</strong> ${order.User?.mobile_number || order.User?.phone || "N/A"}</p>
        
        <p>Please check your orders dashboard for more details.</p>
      </div>
    `;

    return this.sendEmail(shopkeeperEmail, subject, html);
  }

  async sendShopApproved(shopkeeperEmail) {
    const subject = "Welcome to VaayuGo! Your Shop is Approved";
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #03dac6;">Congratulations!</h2>
        <p>Your shop application has been reviewed and approved by our admins.</p>
        <p>Your shop is now <strong>active</strong> and visible to customers on VaayuGo.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/shop/dashboard" style="background-color: #03dac6; color: #121212; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">Go to Shop Dashboard</a>
        </div>
        
        <p>Time to add some products and start selling!</p>
      </div>
    `;

    return this.sendEmail(shopkeeperEmail, subject, html);
  }

  async sendShopRejected(shopkeeperEmail, rejectionReason) {
    const subject = "VaayuGo - Shop Application Update";
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #cf6679;">Application Update</h2>
        <p>We have reviewed your shop application on VaayuGo. Unfortunately, it has been <strong>rejected</strong> at this time.</p>
        
        <h3>Feedback from Admin:</h3>
        <div style="background-color: #f8dbdf; padding: 15px; border-left: 4px solid #cf6679; border-radius: 4px;">
            ${rejectionReason || "No specific reason was provided."}
        </div>
        
        <p>Please address all issues mentioned above and you may contact support for further assistance.</p>
      </div>
    `;

    return this.sendEmail(shopkeeperEmail, subject, html);
  }

  // Phase 5: Admin Notifications
  async sendAdminApprovalRequest(adminEmails, shopDetails) {
    if (!adminEmails || adminEmails.length === 0) return;

    const subject = `New Shop Application: ${shopDetails.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #03dac6;">New Shop Needs Approval</h2>
        <p>A new shop has just registered on VaayuGo and is waiting for your review.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Shop Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopDetails.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Category:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopDetails.category}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Shopkeeper Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopDetails.User?.name || "N/A"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopDetails.phone || "N/A"}</td></tr>
        </table>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/admin/shops" style="background-color: #bb86fc; color: #121212; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">Review Application</a>
        </div>
      </div>
    `;

    // Send to all admins (could be done via loop or BCC if supported)
    const promises = adminEmails.map(email => this.sendEmail(email, subject, html));
    return Promise.all(promises);
  }

  async sendPenaltyNotification(to, amount, reason) {
    const subject = `Penalty Issued - VaayuGO`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #cf6679;">Penalty Issued</h2>
        <p>Dear User,</p>
        <p>A penalty of <strong>₹${amount}</strong> has been issued to your account.</p>
        
        <h3>Reason:</h3>
        <div style="background-color: #f8dbdf; padding: 15px; border-left: 4px solid #cf6679; border-radius: 4px; margin-bottom: 20px;">
            ${reason}
        </div>
        
        <p>If you believe this was issued in error, please contact support immediately.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          Regards,<br>
          <strong>VaayuGO Team</strong>
        </p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}

module.exports = new EmailService();
