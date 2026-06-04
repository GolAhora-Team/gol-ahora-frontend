import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function DatePickerModal({ visible, onClose, onSelect, initialDate, minDate }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialDate) {
        const [y, m, d] = initialDate.split('-');
        setCurrentYear(parseInt(y, 10));
        setCurrentMonth(parseInt(m, 10) - 1);
        setSelectedDateStr(initialDate);
      } else {
        const now = new Date();
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
        setSelectedDateStr('');
      }
      setShowYearPicker(false);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad)
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad)
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, initialDate]);

  const year = currentYear;
  const month = currentMonth;

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    if (month === 0) {
      setCurrentMonth(11);
      setCurrentYear(year - 1);
    } else {
      setCurrentMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setCurrentMonth(0);
      setCurrentYear(year + 1);
    } else {
      setCurrentMonth(month + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selected = `${year}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(selected);
    onSelect(selected);
    onClose();
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    let daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(i).padStart(2, '0');
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
      const isSelected = selectedDateStr === dateStr;
      
      let isDisabled = false;
      if (minDate) {
        isDisabled = dateStr < minDate;
      }

      daysArray.push(
        <TouchableOpacity 
          key={i} 
          style={[styles.dayCell, isSelected && styles.selectedDayCell, isDisabled && { opacity: 0.3 }]}
          onPress={() => !isDisabled && handleSelectDay(i)}
          disabled={isDisabled}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{i}</Text>
        </TouchableOpacity>
      );
    }

    return daysArray;
  };

  const renderYearPicker = () => {
    const currentY = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentY - i);

    return (
      <View style={styles.yearPickerContainer}>
        <ScrollView showsVerticalScrollIndicator={true}>
          {years.map(y => (
            <TouchableOpacity 
              key={y} 
              style={[styles.yearItem, year === y && styles.selectedYearItem]}
              onPress={() => {
                setCurrentYear(y);
                setShowYearPicker(false);
              }}
            >
              <Text style={[styles.yearText, year === y && styles.selectedYearText]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!visible && fadeAnim._value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.titleContainer} 
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text style={styles.titleText}>{MONTHS[month]} {year}</Text>
              <MaterialCommunityIcons 
                name={showYearPicker ? "menu-up" : "menu-down"} 
                size={20} 
                color="#009b3a" 
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {showYearPicker ? renderYearPicker() : (
            <View style={styles.calendarContainer}>
              <View style={styles.daysRow}>
                {DAYS.map((d, i) => (
                  <View key={i} style={styles.dayCell}>
                    <Text style={styles.dayHeader}>{d}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.grid}>
                {renderDays()}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>CERRAR</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navButton: {
    padding: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#009b3a',
    marginRight: 4,
  },
  calendarContainer: {
    minHeight: 250,
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDayCell: {
    backgroundColor: '#009b3a',
    borderRadius: 18,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  yearPickerContainer: {
    height: 250,
  },
  yearItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedYearItem: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  yearText: {
    fontSize: 16,
    color: '#333',
  },
  selectedYearText: {
    color: '#009b3a',
    fontWeight: 'bold',
  },
  cancelBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
