let users = [];
let currentIndex = 0;

const canvas = document.getElementById("certificateCanvas");
const ctx = canvas.getContext("2d");

// Load PDF.js library
const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

let pdfDoc = null;

// Load the PDF as the background
const pdfPath = "./assets/certificate2.pdf";
pdfjsLib.getDocument(pdfPath).promise.then((pdf) => {
  pdfDoc = pdf;
  renderPDFPage(1, () => {
    fetchUserData();
  });
});

function renderPDFPage(pageNumber, callback) {
  pdfDoc.getPage(pageNumber).then((page) => {
    const scale = 2; // Adjust this value for higher/lower quality
    const viewport = page.getViewport({ scale });

    // Resize the canvas to match the PDF page dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    page.render(renderContext).promise.then(() => {
      if (callback) callback();
    });
  });
}

function fetchUserData() {
  fetch("/data/users.json")
    .then((response) => response.json())
    .then((data) => {
      users = data;
      drawCertificate(users[currentIndex]);
    })
    .catch((error) => console.error("Error loading user data:", error));
}

function drawCertificate(user) {
  renderPDFPage(1, () => {
    // Draw user name on top of the PDF background
    ctx.fillStyle = "#000";
    ctx.font = "50px 'Georgia'";
    ctx.textAlign = "center";

    const nameY = canvas.height / 2 + 20; // Adjust position as needed
    ctx.fillText(user.name, canvas.width / 2, nameY);
  });
}

function generateCertificate(user, callback) {
  renderPDFPage(1, () => {
    ctx.fillStyle = "#000";
    ctx.font = "50px 'Georgia'";
    ctx.textAlign = "center";

    const nameY = canvas.height / 2 + 20;
    ctx.fillText(user.name, canvas.width / 2, nameY);

    canvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${user.name}_certificate.png`;
      link.click();

      if (callback) callback(); // Call the callback after the certificate is generated
    }, "image/png");
  });
}

// Previous button
document.getElementById("prevBtn").addEventListener("click", () => {
  if (users.length === 0) return;
  currentIndex = (currentIndex - 1 + users.length) % users.length;
  drawCertificate(users[currentIndex]);
});

// Next button
document.getElementById("nextBtn").addEventListener("click", () => {
  if (users.length === 0) return;
  currentIndex = (currentIndex + 1) % users.length;
  drawCertificate(users[currentIndex]);
});

// Download current certificate
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (users.length === 0) return;
  generateCertificate(users[currentIndex]);
});

// 📥 Download all certificates as individual files (as per your initial request)
document.getElementById("downloadAllBtn").addEventListener("click", () => {
  let i = 0;

  function generateNext() {
    if (i >= users.length) return;
    generateCertificate(users[i], () => {
      i++; // Increment index after each certificate is generated
      setTimeout(generateNext, 800); // Delay to allow blob/download
    });
  }

  generateNext();
});

// 📥 Download all certificates as a single PDF
document.getElementById("downloadAllBtn2").addEventListener("click", () => {
  const pdf = new jsPDF();
  let i = 0;

  function generateNext() {
    if (i >= users.length) {
      pdf.save("all_certificates.pdf"); // Save the final PDF once all certificates are added
      return;
    }

    generateCertificate(users[i], () => {
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, 10, canvas.width / 3, canvas.height / 3); // Adjust the image size as needed
      i++;

      // Add a new page for the next certificate
      if (i < users.length) pdf.addPage();

      setTimeout(generateNext, 800); // Delay to allow blob/download
    });
  }

  generateNext();
});
