/**
 * Esta función debe ser asignada a un activador instalable (installable trigger) onEdit
 * para poder acceder a la propiedad e.oldValue.
 * Registra los cambios en la hoja 'changelog' si la edición
 * ocurre en el rango E:J de la hoja 'Casos de uso'.
 * @param {Object} e - El objeto de evento que contiene información sobre la edición.
 */
function onEdit(e) {
  // Definimos las constantes.
  const sheetNameToMonitor = 'Casos de uso';
  const changelogSheetName = 'changelog';
  const columnRangeToMonitor = [5, 10]; // 5 es la columna 'E', 10 es la 'J'

  // Accedemos a la hoja de cálculo activa y la hoja que fue editada.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = e.range.getSheet();
  
  // Verificamos si la edición ocurrió en la hoja y el rango correctos.
  if (activeSheet.getName() === sheetNameToMonitor && 
      e.range.getColumn() >= columnRangeToMonitor[0] && 
      e.range.getColumn() <= columnRangeToMonitor[1]) {
    
    // Obtenemos los valores de la celda modificada.
    const editedRow = e.range.getRow();
    const editedCol = e.range.getColumn();
    
    // Accedemos a las hojas de destino.
    const sourceSheet = ss.getSheetByName(sheetNameToMonitor);
    const destinationSheet = ss.getSheetByName(changelogSheetName);

    // Si la hoja 'changelog' no existe, la creamos.
    if (!destinationSheet) {
      ss.insertSheet(changelogSheetName);
    }
    
    // Obtenemos los datos de la fila que se va a registrar.
    const dataToCopy = sourceSheet.getRange(editedRow, 1, 1, 11).getValues()[0];

    // Obtenemos los metadatos del cambio.
    const header = sourceSheet.getRange(1, editedCol).getValue();
    const user = Session.getActiveUser().getEmail();
    const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
    
    // Obtenemos el valor nuevo y el valor anterior.
    const editedValue = e.value || ''; // El valor nuevo
    const oldValue = e.oldValue || ''; // El valor anterior
    
    // Combina los datos y los metadatos en un solo array.
    // La columna P se reserva para el valor anterior y la Q para el valor nuevo.
    const newRecord = [...dataToCopy, header, user, timestamp, oldValue, editedValue];

    // Añadimos la nueva fila al final de la hoja 'changelog'.
    destinationSheet.appendRow(newRecord);
  }
}