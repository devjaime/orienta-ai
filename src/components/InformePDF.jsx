import React from 'react'
import { Page, Text, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer'

// Styles para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #0B1A33',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1A33',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1A33',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1 solid #ddd',
  },
  text: {
    marginBottom: 6,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  barContainer: {
    width: '60%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#0B1A33',
    borderRadius: 4,
  },
  careerCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    borderLeft: '3 solid #0B1A33',
  },
  careerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0B1A33',
    marginBottom: 4,
  },
  match: {
    fontSize: 10,
    color: '#0B1A33',
    fontWeight: 'bold',
  },
  salary: {
    fontSize: 10,
    color: '#28a745',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTop: '1 solid #eee',
    paddingTop: 10,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eee',
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 10,
    flex: 1,
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#666',
  },
})

// Componente del PDF
export const InformePDF = ({ perfil, carreras }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📘 Informe Vocacional</Text>
        <Text style={styles.subtitle}>Vocari.cl - Guía Vocacional con IA</Text>
      </View>

      {/* Perfil RIASEC */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tu Perfil RIASEC</Text>
        <Text style={styles.text}>
          Código: <Text style={styles.bold}>{perfil.codigo}</Text> - {perfil.nombre}
        </Text>
        <Text style={styles.text}>{perfil.descripcion}</Text>
        
        <View style={{ marginTop: 15 }}>
          {Object.entries(perfil.dimensiones).map(([dim, score]) => (
            <View key={dim} style={styles.row}>
              <Text style={{ width: 80 }}>
                {dim === 'R' && 'Realista'}
                {dim === 'I' && 'Investigativo'}
                {dim === 'A' && 'Artístico'}
                {dim === 'S' && 'Social'}
                {dim === 'E' && 'Empresarial'}
                {dim === 'C' && 'Convencional'}
              </Text>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${score}%` }]} />
              </View>
              <Text style={{ width: 40, textAlign: 'right' }}>{score}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Carreras Recomendadas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carreras Recomendadas</Text>
        {carreras.map((carrera, index) => (
          <View key={index} style={styles.careerCard}>
            <View style={styles.row}>
              <Text style={styles.careerTitle}>{index + 1}. {carrera.nombre}</Text>
              <Text style={styles.match}>{carrera.match}%</Text>
            </View>
            <Text style={styles.text}>{carrera.area}</Text>
            <Text style={styles.text}>{carrera.descripcion}</Text>
            <Text style={styles.salary}>
              💰 Remuneración: ${carrera.salary.min.toLocaleString()} - ${carrera.salary.max.toLocaleString()} CLP
            </Text>
            <Text style={styles.text}>📈 Demanda: {carrera.demand}</Text>
          </View>
        ))}
      </View>

      {/* Proyección Salarial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proyección Salarial (miles CLP)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 0.5 }]}>Año</Text>
            <Text style={styles.tableCell}>Psicología</Text>
            <Text style={styles.tableCell}>Diseño</Text>
            <Text style={styles.tableCell}>Pedagogía</Text>
          </View>
          {[
            { year: 2024, psychology: 850, diseno: 700, pedagogia: 750 },
            { year: 2025, psychology: 880, diseno: 740, pedagogia: 780 },
            { year: 2026, psychology: 920, diseno: 790, pedagogia: 820 },
            { year: 2027, psychology: 960, diseno: 850, pedagogia: 860 },
            { year: 2028, psychology: 1000, diseno: 900, pedagogia: 900 },
          ].map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>{row.year}</Text>
              <Text style={styles.tableCell}>${row.psychology}k</Text>
              <Text style={styles.tableCell}>${row.diseno}k</Text>
              <Text style={styles.tableCell}>${row.pedagogia}k</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recomendación Destacada */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 Carrera Recomendada: Psicología</Text>
        <Text style={styles.text}>
          Alta compatibilidad con tu perfil SIA. Demanda sostenida en el mercado chileno.
          Múltiples áreas de especialización: clínica, educacional, organizacional.
        </Text>
        <Text style={styles.text}>
          📅 Duración: 5 años | 💰 Promedio: $1.200.000 CLP | 📈 Demanda: Alta
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Generado por Vocari.cl | Basado en datos MINEDUC 2025 y método RIASEC
      </Text>
    </Page>
  </Document>
)

export default InformePDF
