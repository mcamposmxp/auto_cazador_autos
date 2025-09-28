/**
 * Se ejecuta con un activador de tiempo para detectar cambios en los comentarios.
 * Registra los cambios en la hoja 'comments' y evita duplicados.
 */
function checkComments() {
  const sheetNameToMonitor = 'Casos de uso';
  const newCommentsSheetName = 'comments';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetNameToMonitor);
  
  if (!sheet) return;

  let commentsSheet = ss.getSheetByName(newCommentsSheetName);
  if (!commentsSheet) {
    commentsSheet = ss.insertSheet(newCommentsSheetName);
    commentsSheet.appendRow(['Fila', 'Columna', 'Usuario', 'Fecha', 'Comentario Anterior', 'Comentario Nuevo']);
    Logger.log('Hoja "comments" creada con los encabezados.');
  }

  const columnsToMonitor = [5, 6, 7, 8, 9, 10]; // Columnas E a J
  const allComments = {};

  const lastRow = sheet.getLastRow();
  Logger.log(`Recorriendo ${lastRow} filas en la hoja "${sheetNameToMonitor}".`);

  for (let i = 1; i <= lastRow; i++) {
    for (const colIndex of columnsToMonitor) {
      const cell = sheet.getRange(i, colIndex);
      const comment = cell.getComment();
      if (comment) {
        allComments[`${i}-${colIndex}`] = comment;
      }
    }
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  const storedCommentsStr = scriptProperties.getProperty('comments');
  const storedComments = storedCommentsStr ? JSON.parse(storedCommentsStr) : {};
  
  const user = Session.getActiveUser().getEmail();
  const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
  
  let changesFound = false;

  for (const key in allComments) {
    if (allComments[key] !== storedComments[key]) {
      const [row, col] = key.split('-').map(Number);
      const header = sheet.getRange(1, col).getValue();
      const oldValue = storedComments[key] || '';
      const newValue = allComments[key];
      
      const newRecord = [row, header, user, timestamp, oldValue, newValue];
      Logger.log(`Intento de agregar/modificar registro: ` + JSON.stringify(newRecord));
      commentsSheet.appendRow(newRecord);
      changesFound = true;
    }
  }

  for (const key in storedComments) {
    if (!allComments[key]) {
      const [row, col] = key.split('-').map(Number);
      const header = sheet.getRange(1, col).getValue();
      const oldValue = storedComments[key];
      const newValue = "Comentario eliminado";

      const newRecord = [row, header, user, timestamp, oldValue, newValue];
      Logger.log(`Intento de agregar registro de eliminación: ` + JSON.stringify(newRecord));
      commentsSheet.appendRow(newRecord);
      changesFound = true;
    }
  }
  
  scriptProperties.setProperty('comments', JSON.stringify(allComments));
  
  if (!changesFound) {
    Logger.log('No se encontraron nuevos cambios de comentarios para registrar.');
  }
}