import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

interface Question {
  text: string;
  marks: number;
  difficulty: string;
  answer?: string;
}

interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

interface AssignmentData {
  title: string;
  subject: string;
  class: string;
  schoolName: string;
  totalMarks: number;
  sections: Section[];
}

export const generatePDF = async (data: AssignmentData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [width, height] = PageSizes.A4;
  let page = pdfDoc.addPage([width, height]);
  let y = height - 40;
  const margin = 50;
  const contentWidth = width - 2 * margin;

  const addPage = () => {
    page = pdfDoc.addPage([width, height]);
    y = height - 40;
  };

  const checkPageBreak = (needed: number) => {
    if (y - needed < 50) addPage();
  };

  const drawText = (
    text: string,
    x: number,
    size: number,
    isBold = false,
    color = rgb(0, 0, 0)
  ) => {
    checkPageBreak(size + 10);
    page.drawText(text, { x, y, size, font: isBold ? boldFont : font, color });
    y -= size + 8;
  };

  const drawLine = () => {
    checkPageBreak(10);
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 10;
  };

  const wrapAndDrawText = (text: string, x: number, size: number, maxWidth: number, isBold = false) => {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line !== '') {
        checkPageBreak(size + 8);
        page.drawText(line.trim(), { x, y, size, font: isBold ? boldFont : font });
        y -= size + 6;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      checkPageBreak(size + 8);
      page.drawText(line.trim(), { x, y, size, font: isBold ? boldFont : font });
      y -= size + 6;
    }
  };

  // ─── Header ───────────────────────────────────────────────────────────────
  drawText(data.schoolName, margin, 16, true);
  drawText(`Subject: ${data.subject}    Class: ${data.class}`, margin, 12, true);
  drawText(`Maximum Marks: ${data.totalMarks}    Time: 3 Hours`, margin, 11);
  drawLine();
  drawText('Name: ______________________________  Roll No.: ____________  Section: ________', margin, 10);
  drawLine();
  y -= 5;

  // ─── Sections ─────────────────────────────────────────────────────────────
  for (const section of data.sections) {
    checkPageBreak(60);
    // Section heading (centred approximation)
    const titleWidth = boldFont.widthOfTextAtSize(section.title, 13);
    drawText(section.title, margin + (contentWidth - titleWidth) / 2, 13, true);
    wrapAndDrawText(section.instruction, margin, 10, contentWidth);
    y -= 5;

    section.questions.forEach((q, idx) => {
      checkPageBreak(45);
      const marksText = `[${q.marks} mark${q.marks > 1 ? 's' : ''}]`;
      const marksWidth = boldFont.widthOfTextAtSize(marksText, 10);
      const qPrefix = `${idx + 1}. `;
      const qPrefixWidth = font.widthOfTextAtSize(qPrefix, 10);

      // Draw question number
      checkPageBreak(16);
      page.drawText(qPrefix, { x: margin, y, size: 10, font });

      // Wrap the question body
      const words = q.text.split(' ');
      let line = '';
      let firstLine = true;
      const bodyX = margin + qPrefixWidth;
      const bodyWidth = contentWidth - qPrefixWidth - marksWidth - 5;

      for (const word of words) {
        const testLine = line + word + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        if (testWidth > bodyWidth && line !== '') {
          page.drawText(line.trim(), { x: bodyX, y, size: 10, font });
          if (firstLine) {
            page.drawText(marksText, {
              x: width - margin - marksWidth,
              y,
              size: 10,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            firstLine = false;
          }
          y -= 14;
          checkPageBreak(14);
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        checkPageBreak(14);
        page.drawText(line.trim(), { x: bodyX, y, size: 10, font });
        if (firstLine) {
          page.drawText(marksText, {
            x: width - margin - marksWidth,
            y,
            size: 10,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        }
        y -= 14;
      }
      y -= 4; // extra gap between questions
    });
    y -= 12;
  }

  // ─── Answer Key ───────────────────────────────────────────────────────────
  addPage();
  drawText('ANSWER KEY', margin, 14, true);
  drawLine();

  for (const section of data.sections) {
    drawText(section.title, margin, 12, true);
    section.questions.forEach((q, idx) => {
      if (q.answer) {
        checkPageBreak(30);
        const label = `${idx + 1}. `;
        page.drawText(label, { x: margin + 10, y, size: 9, font: boldFont });
        wrapAndDrawText(
          q.answer,
          margin + 10 + font.widthOfTextAtSize(label, 9),
          9,
          contentWidth - 20
        );
      }
    });
    y -= 8;
  }

  return pdfDoc.save();
};
