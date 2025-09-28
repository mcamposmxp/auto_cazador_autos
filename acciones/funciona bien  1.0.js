/**
 * Se activa automáticamente cada vez que se edita una celda.
 * Registra los cambios en la hoja 'changelog' si la edición
 * ocurre en el rango E:J de la hoja 'Casos de uso'.
 * @param {Object} e - El objeto de evento que contiene información sobre la edición.
 */
function onEdit(e) {
  // Define las constantes para el nombre de la hoja de monitoreo, la hoja de registro
  // y el rango de columnas a monitorear.
  const sheetNameToMonitor = 'Casos de uso';
  const changelogSheetName = 'changelog';
  const columnRangeToMonitor = [5, 10]; // 5 es la columna 'E', 10 es la 'J'

  // Accede a la hoja de cálculo activa y la hoja que fue editada.
  const ss = SpreadsheetApp.getActiveSpreadsheet(); // <--- Aquí se corrigió el error.
  const activeSheet = e.range.getSheet();

  // Verifica si la edición ocurrió en la hoja y el rango correctos.
  if (activeSheet.getName() === sheetNameToMonitor && 
      e.range.getColumn() >= columnRangeToMonitor[0] && 
      e.range.getColumn() <= columnRangeToMonitor[1]) {
    
    // Obtiene la fila de la celda modificada.
    const editedRow = e.range.getRow();

    // Accede a la hoja de 'Casos de uso' y 'changelog'.
    const sourceSheet = ss.getSheetByName(sheetNameToMonitor);
    const destinationSheet = ss.getSheetByName(changelogSheetName);

    // Si la hoja 'changelog' no existe, la crea.
    if (!destinationSheet) {
      ss.insertSheet(changelogSheetName);
    }
    
    // Define el rango de datos a copiar (Columnas A:K) de la fila editada.
    const dataToCopy = sourceSheet.getRange(editedRow, 1, 1, 11).getValues()[0];

    // Obtiene los metadatos del cambio.
    const header = sourceSheet.getRange(1, e.range.getColumn()).getValue();
    const user = Session.getActiveUser().getEmail();
    const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
    
    // Combina los datos y los metadatos en un solo array.
    const newRecord = [...dataToCopy, header, user, timestamp];

    // Añade la nueva fila al final de la hoja 'changelog'.
    destinationSheet.appendRow(newRecord);
  }
}