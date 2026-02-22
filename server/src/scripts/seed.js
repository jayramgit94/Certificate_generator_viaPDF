/**
 * Seed Script — Populates the database with initial data
 * Usage: node src/scripts/seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const config = require("../config");
const Admin = require("../models/Admin");
const Template = require("../models/Template");
const EmailTemplate = require("../models/EmailTemplate");

// Generate a blank landscape A4 PDF with a decorative border and title
async function generateSeedPdf(filename, title, bgColor) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontLight = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Background
  const r = parseInt(bgColor.slice(1, 3), 16) / 255;
  const g = parseInt(bgColor.slice(3, 5), 16) / 255;
  const b = parseInt(bgColor.slice(5, 7), 16) / 255;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(r, g, b),
  });

  // Border
  const borderColor = rgb(0.3, 0.3, 0.5);
  page.drawRectangle({
    x: 20,
    y: 20,
    width: 802,
    height: 555,
    borderColor,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 782,
    height: 535,
    borderColor,
    borderWidth: 1,
  });

  // Title
  const titleWidth = font.widthOfTextAtSize(title, 36);
  page.drawText(title, {
    x: (842 - titleWidth) / 2,
    y: 440,
    size: 36,
    font,
    color: rgb(0.1, 0.15, 0.3),
  });

  // Subtitle
  const sub = "This is proudly presented to";
  const subWidth = fontLight.widthOfTextAtSize(sub, 16);
  page.drawText(sub, {
    x: (842 - subWidth) / 2,
    y: 380,
    size: 16,
    font: fontLight,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Name placeholder line
  page.drawRectangle({
    x: 221,
    y: 310,
    width: 400,
    height: 2,
    color: rgb(0.3, 0.3, 0.5),
  });

  // Date placeholder
  const dateTxt = "Date: _______________";
  page.drawText(dateTxt, {
    x: 340,
    y: 120,
    size: 12,
    font: fontLight,
    color: rgb(0.45, 0.5, 0.55),
  });

  const pdfBytes = await pdfDoc.save();
  const uploadDir = path.join(__dirname, "..", "..", "uploads", "templates");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, pdfBytes);
  return `uploads/templates/${filename}`;
}

const seedData = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log("Connected to MongoDB");

    // 1. Seed Super Admin
    const existingAdmin = await Admin.findOne({
      email: "admin@certifypro.com",
    });
    let admin;
    if (existingAdmin) {
      admin = existingAdmin;
      console.log("Admin already exists, skipping...");
    } else {
      admin = await Admin.create({
        name: "Super Admin",
        email: "admin@certifypro.com",
        password: "Admin@123456",
        role: "super_admin",
      });
      console.log("Super Admin created: admin@certifypro.com / Admin@123456");
    }

    // 2. Seed Certificate Templates (with generated PDFs)
    const templateCount = await Template.countDocuments({ admin: admin._id });
    if (templateCount === 0) {
      const pdf1 = await generateSeedPdf(
        "seed-achievement.pdf",
        "CERTIFICATE OF ACHIEVEMENT",
        "#FFFFFF",
      );
      const pdf2 = await generateSeedPdf(
        "seed-participation.pdf",
        "CERTIFICATE OF PARTICIPATION",
        "#FFF8F0",
      );
      const pdf3 = await generateSeedPdf(
        "seed-excellence.pdf",
        "AWARD OF EXCELLENCE",
        "#FFFFF0",
      );

      const templates = [
        {
          admin: admin._id,
          name: "Professional Achievement",
          description:
            "Clean professional certificate for course completion and achievements",
          pdfFile: pdf1,
          pdfPages: 1,
          status: "active",
          fields: [
            {
              id: "name",
              type: "placeholder",
              placeholder: "{{name}}",
              text: "",
              x: 50,
              y: 42,
              width: 500,
              height: 50,
              fontFamily: "Helvetica",
              fontSize: 32,
              fontColor: "#2d3748",
              fontWeight: "bold",
              textAlign: "center",
            },
            {
              id: "course",
              type: "placeholder",
              placeholder: "{{course}}",
              text: "",
              x: 50,
              y: 58,
              width: 500,
              height: 30,
              fontFamily: "Helvetica",
              fontSize: 18,
              fontColor: "#4a5568",
              textAlign: "center",
            },
            {
              id: "date",
              type: "placeholder",
              placeholder: "{{date}}",
              text: "",
              x: 50,
              y: 75,
              width: 200,
              height: 25,
              fontFamily: "Helvetica",
              fontSize: 14,
              fontColor: "#718096",
              textAlign: "center",
            },
          ],
        },
        {
          admin: admin._id,
          name: "Workshop Participation",
          description: "Certificate for workshop and seminar participation",
          pdfFile: pdf2,
          pdfPages: 1,
          status: "active",
          fields: [
            {
              id: "name",
              type: "placeholder",
              placeholder: "{{name}}",
              text: "",
              x: 50,
              y: 40,
              width: 500,
              height: 50,
              fontFamily: "Helvetica",
              fontSize: 30,
              fontColor: "#2D3748",
              fontWeight: "bold",
              textAlign: "center",
            },
            {
              id: "event",
              type: "placeholder",
              placeholder: "{{event}}",
              text: "",
              x: 50,
              y: 55,
              width: 500,
              height: 30,
              fontFamily: "Helvetica",
              fontSize: 18,
              fontColor: "#4A5568",
              textAlign: "center",
            },
            {
              id: "date",
              type: "placeholder",
              placeholder: "{{date}}",
              text: "",
              x: 50,
              y: 72,
              width: 200,
              height: 25,
              fontFamily: "Helvetica",
              fontSize: 14,
              fontColor: "#718096",
              textAlign: "center",
            },
          ],
        },
        {
          admin: admin._id,
          name: "Excellence Award",
          description:
            "Premium certificate template for excellence and merit recognition",
          pdfFile: pdf3,
          pdfPages: 1,
          status: "active",
          fields: [
            {
              id: "name",
              type: "placeholder",
              placeholder: "{{name}}",
              text: "",
              x: 50,
              y: 38,
              width: 500,
              height: 50,
              fontFamily: "Helvetica",
              fontSize: 32,
              fontColor: "#1A202C",
              fontWeight: "bold",
              textAlign: "center",
            },
            {
              id: "achievement",
              type: "placeholder",
              placeholder: "{{achievement}}",
              text: "",
              x: 50,
              y: 55,
              width: 500,
              height: 30,
              fontFamily: "Helvetica",
              fontSize: 18,
              fontColor: "#4A5568",
              textAlign: "center",
            },
            {
              id: "date",
              type: "placeholder",
              placeholder: "{{date}}",
              text: "",
              x: 50,
              y: 75,
              width: 200,
              height: 25,
              fontFamily: "Helvetica",
              fontSize: 14,
              fontColor: "#718096",
              textAlign: "center",
            },
          ],
        },
      ];

      await Template.insertMany(templates);
      console.log(`${templates.length} certificate templates created`);
    } else {
      console.log(`Templates already exist (${templateCount}), skipping...`);
    }

    // 3. Seed Email Templates
    const emailTplCount = await EmailTemplate.countDocuments({
      admin: admin._id,
    });
    if (emailTplCount === 0) {
      const emailTemplates = [
        {
          admin: admin._id,
          name: "Certificate Delivery",
          subject: "Your Certificate: {{course}}",
          body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="text-align:center;padding:20px 0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px 8px 0 0"><h1 style="color:white;margin:0">CertifyPro</h1></div><div style="padding:30px;background:#fff;border:1px solid #e2e8f0"><p>Dear <strong>{{name}}</strong>,</p><p>Congratulations! Your certificate for <strong>{{course}}</strong> has been generated successfully.</p><p>Please find your certificate attached to this email.</p><p style="margin-top:20px">Best regards,<br>CertifyPro Team</p></div><div style="text-align:center;padding:15px;background:#f7fafc;border-radius:0 0 8px 8px;font-size:12px;color:#a0aec0"><p>Automated email from CertifyPro</p></div></div>`,
          isDefault: true,
        },
        {
          admin: admin._id,
          name: "Workshop Completion",
          subject: "Certificate of Participation - {{event}}",
          body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="text-align:center;padding:20px 0;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:8px 8px 0 0"><h1 style="color:white;margin:0">CertifyPro</h1></div><div style="padding:30px;background:#fff;border:1px solid #e2e8f0"><p>Hello <strong>{{name}}</strong>,</p><p>Thank you for participating in <strong>{{event}}</strong>!</p><p>Your certificate of participation is attached. We hope you found the workshop valuable.</p><p style="margin-top:20px">Warm regards,<br>CertifyPro Team</p></div></div>`,
          isDefault: false,
        },
      ];

      await EmailTemplate.insertMany(emailTemplates);
      console.log(`${emailTemplates.length} email templates created`);
    } else {
      console.log(
        `Email templates already exist (${emailTplCount}), skipping...`,
      );
    }

    console.log("\nSeed completed successfully!");
    console.log("Login with:");
    console.log("  Email:    admin@certifypro.com");
    console.log("  Password: Admin@123456");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedData();
