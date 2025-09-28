/**
 * Se activa automáticamente cada vez que se edita una celda.
 * Registra los cambios de contenido en la hoja 'changelog'.
 * @param {Object} e - El objeto de evento de edición.
 */
function onEdit(e) {
  // Define las constantes de las hojas y columnas a monitorear.
  const sheetNameToMonitor = 'Casos de uso';
  const changelogSheetName = 'changelog';
  const columnRangeToMonitor = [5, 10]; // Columnas E a J

  // Accede a la hoja activa y la hoja de registro.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = e.range.getSheet();

  // Verifica si la edición ocurrió en la hoja y rango correctos.
  if (activeSheet.getName() === sheetNameToMonitor &&
      e.range.getColumn() >= columnRangeToMonitor[0] &&
      e.range.getColumn() <= columnRangeToMonitor[1]) {
    
    // Si la celda editada no es un comentario, registra el cambio de contenido.
    const editedRow = e.range.getRow();
    const editedCol = e.range.getColumn();
    const sourceSheet = ss.getSheetByName(sheetNameToMonitor);
    const destinationSheet = ss.getSheetByName(changelogSheetName);

    // Si la hoja 'changelog' no existe, la crea.
    if (!destinationSheet) {
      ss.insertSheet(changelogSheetName);
    }
    
    // Obtenemos los datos de la fila.
    const dataToCopy = sourceSheet.getRange(editedRow, 1, 1, 11).getValues()[0];

    // Obtenemos metadatos.
    const header = sourceSheet.getRange(1, editedCol).getValue();
    const user = Session.getActiveUser().getEmail();
    const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
    
    // Obtenemos los valores de la celda.
    const editedValue = e.value || '';
    const oldValue = e.oldValue || '';
    
    // Unimos los datos para el registro.
    // L: header, M: user, N: timestamp, O: oldValue, P: editedValue, Q: comment
    const newRecord = [...dataToCopy, header, user, timestamp, oldValue, editedValue, ""]; // El comentario lo manejaremos aparte

    // Agregamos la fila.
    destinationSheet.appendRow(newRecord);
  }
}

/**
 * Función que se ejecuta con un activador de tiempo (por ejemplo, cada 5 minutos)
 * para detectar cambios en los comentarios y registrarlos.
 */
function checkComments() {
  const sheetNameToMonitor = 'Casos de uso';
  const changelogSheetName = 'changelog';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetNameToMonitor);
  const changelogSheet = ss.getSheetByName(changelogSheetName);
  
  // Si la hoja 'Casos de uso' no existe, terminamos.
  if (!sheet) return;
  
  // Rango de columnas a monitorear (E:J)
  const columnsToMonitor = [5, 6, 7, 8, 9, 10];
  const allComments = {};
  
  // Recorremos las filas y columnas para obtener los comentarios actuales.
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  const values = range.getValues();
  
  for (let i = 0; i < lastRow; i++) {
    for (let j = 0; j < values[i].length; j++) {
      if (columnsToMonitor.includes(j + 1)) {
        const cell = sheet.getRange(i + 1, j + 1);
        const comment = cell.getComment();
        if (comment) {
          allComments[`${i + 1}-${j + 1}`] = comment;
        }
      }
    }
  }

  // Obtenemos los comentarios guardados de la última ejecución.
  const scriptProperties = PropertiesService.getScriptProperties();
  const storedCommentsStr = scriptProperties.getProperty('comments');
  const storedComments = storedCommentsStr ? JSON.parse(storedCommentsStr) : {};
  
  // Comparamos los comentarios actuales con los almacenados.
  const user = Session.getActiveUser().getEmail();
  const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
  
  // 1. Identificamos comentarios agregados o modificados.
  for (const key in allComments) {
    if (allComments[key] !== storedComments[key]) {
      const [row, col] = key.split('-').map(Number);
      const sourceRange = sheet.getRange(row, col);
      const rowData = sheet.getRange(row, 1, 1, 11).getValues()[0];
      const header = sheet.getRange(1, col).getValue();
      
      const newRecord = [...rowData, header, user, timestamp, "", "", allComments[key]];
      changelogSheet.appendRow(newRecord);
    }
  }
  
  // 2. Identificamos comentarios eliminados.
  for (const key in storedComments) {
    if (!allComments[key]) {
      const [row, col] = key.split('-').map(Number);
      const rowData = sheet.getRange(row, 1, 1, 11).getValues()[0];
      const header = sheet.getRange(1, col).getValue();

      // Guardamos un registro con un mensaje claro de que el comentario fue eliminado.
      const newRecord = [...rowData, header, user, timestamp, storedComments[key], "", "Comentario eliminado"];
      changelogSheet.appendRow(newRecord);
    }
  }
  
  // Guardamos el nuevo estado de los comentarios.
  scriptProperties.setProperty('comments', JSON.stringify(allComments));
}