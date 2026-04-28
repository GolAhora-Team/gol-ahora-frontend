import { Alert, Platform } from 'react-native';

/**

 * @param {Object} item - El objeto completo a eliminar (para mostrar el nombre).
 * @param {Function} onConfirm - La función que realmente borra (setUsers, setCanchas, etc).
 * @param {string} title - Título de la alerta (ej: "Eliminar Usuario").
 */
export const confirmarEliminacion = (item, onConfirm, title = "Confirmar Eliminación") => {
  const nombreItem = item.nombre || item.apellido || "este registro";
  
  const execute = () => {
    onConfirm();
  };

  if (Platform.OS === 'web') {
    const confirmWeb = window.confirm(`${title}\n\n¿Estás seguro de eliminar a ${nombreItem}?`);
    if (confirmWeb) execute();
  } else {
    Alert.alert(
      title,
      `¿Estás seguro de eliminar a ${nombreItem}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "ELIMINAR", onPress: execute, style: "destructive" }
      ]
    );
  }
};