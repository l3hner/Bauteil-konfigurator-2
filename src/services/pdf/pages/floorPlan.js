const layout = require('../layout');

module.exports = {
  title: 'Ihre Raumplanung',

  condition(submission) {
    return (submission.rooms?.erdgeschoss?.length > 0) ||
           (submission.rooms?.obergeschoss?.length > 0) ||
           (submission.rooms?.untergeschoss?.length > 0);
  },

  render(doc, submission, ctx) {
    let y = 100;
    const marginLeft = 60;
    const contentWidth = 475;

    const rooms = submission.rooms || {};
    const floors = [
      { name: 'Erdgeschoss', rooms: rooms.erdgeschoss || [] },
      { name: 'Obergeschoss', rooms: rooms.obergeschoss || [] },
      { name: 'Untergeschoss (Partnerkeller oder bauseits)', rooms: rooms.untergeschoss || [] }
    ].filter(floor => floor.rooms.length > 0);

    if (floors.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textMuted);
      doc.text('Keine Räume definiert', marginLeft, y);
      return;
    }

    floors.forEach((floor, floorIdx) => {
      if (y > 720) return; // Overflow guard: skip floor if no room for header + items
      if (floorIdx > 0) y += 25;

      // Geschoss-Header
      doc.roundedRect(marginLeft, y, contentWidth, 28, 4).fill(layout.colors.primary);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.white);
      doc.text(floor.name, marginLeft + 15, y + 8);
      y += 40;

      // Raum-Liste
      floor.rooms.forEach((room, idx) => {
        if (y > 740) return; // Overflow guard: stop before footer zone
        const roomName = room.name || `Raum ${idx + 1}`;

        doc.font('Helvetica').fontSize(10).fillColor(layout.colors.gray);
        doc.text('•', marginLeft + 10, y, { lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.text);
        doc.text(roomName, marginLeft + 22, y, { lineBreak: false });
        if (room.details) {
          const nameWidth = doc.widthOfString(roomName, { font: 'Helvetica-Bold', fontSize: 10 });
          doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
          doc.text(` \u2013 ${room.details}`, marginLeft + 22 + nameWidth, y, { width: contentWidth - nameWidth - 32 });
        }
        y += 18;
      });
    });

    // Hinweis (only if enough space before footer)
    y += 20;
    if (y + 60 < 780) {
    doc.roundedRect(marginLeft, y, contentWidth, 40, 6).fill(layout.colors.grayLight);
    doc.rect(marginLeft, y, 4, 40).fill(layout.colors.gray);
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
    doc.text('Durch unsere freie Raumplanung können wir all Ihre Wünsche umsetzen. Bei Lehner Haus haben Sie 100 % freie Grundrissgestaltung.', marginLeft + 15, y + 12, { width: contentWidth - 30 });
    }
  }
};
