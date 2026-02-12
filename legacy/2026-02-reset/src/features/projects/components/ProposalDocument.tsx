import React from 'react'
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'
import { registerFonts } from '@/features/projects/lib/pdf/fonts'

// Register fonts immediately
registerFonts()

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Roboto',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerInfo: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4F46E5', // Indigo-600
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 4,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    section: {
        flexDirection: 'column',
        width: '45%',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    text: {
        fontSize: 10,
        color: '#4B5563',
        marginBottom: 4,
        lineHeight: 1.5,
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        padding: 8,
    },
    colDesc: { width: '50%' },
    colQty: { width: '15%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },

    tableHeaderText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
    },
    tableCell: {
        fontSize: 10,
        color: '#4B5563',
    },
    totals: {
        alignSelf: 'flex-end',
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        paddingVertical: 4,
    },
    finalTotal: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    totalValueLarge: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 20,
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    },
})

interface ProposalItem {
    description: string
    quantity: number
    unitPrice: number | string
    totalPrice: number | string
}

interface ProposalCompany {
    name: string
    address?: string | null
    email?: string | null
    phone?: string | null
    taxNo?: string | null
    taxOffice?: string | null
}

interface ProposalData {
    id: string
    createdAt: Date | string
    validUntil?: Date | string | null
    company?: ProposalCompany | null
    subject: string
    notes?: string | null
    items?: ProposalItem[]
    currency: string
    subtotal: number | string
    taxRate: number | string
    taxAmount: number | string
    total: number | string
}

interface ProposalDocumentProps {
    data: ProposalData
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ data }) => {
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('tr-TR')
    }

    const formatCurrency = (amount: number | string, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(Number(amount))
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.companyName}>ProSektorWeb</Text>
                        <Text style={styles.text}>Yazılım ve Danışmanlık Hizmetleri</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.title}>TEKLİF</Text>
                        <Text style={styles.subtitle}>Teklif No: #{data.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.subtitle}>Tarih: {formatDate(data.createdAt)}</Text>
                        <Text style={styles.subtitle}>Geçerlilik: {data.validUntil ? formatDate(data.validUntil) : '30 Gün'}</Text>
                    </View>
                </View>

                {/* Client & Provider Info */}
                <View style={styles.grid}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sayın / Firma</Text>
                        <Text style={[styles.text, { fontWeight: 'bold' }]}>{data.company?.name}</Text>
                        <Text style={styles.text}>{data.company?.address || 'Adres bilgisi girilmemiş'}</Text>
                        <Text style={styles.text}>{data.company?.email}</Text>
                        <Text style={styles.text}>{data.company?.phone}</Text>
                        {data.company?.taxNo && (
                            <Text style={styles.text}>VN: {data.company.taxNo} / {data.company.taxOffice}</Text>
                        )}
                    </View>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Teklif Konusu</Text>
                        <Text style={[styles.text, { marginBottom: 10 }]}>{data.subject}</Text>
                        {data.notes && (
                            <>
                                <Text style={styles.sectionTitle}>Notlar</Text>
                                <Text style={styles.text}>{data.notes}</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <View style={styles.colDesc}><Text style={styles.tableHeaderText}>Açıklama</Text></View>
                        <View style={styles.colQty}><Text style={styles.tableHeaderText}>Miktar</Text></View>
                        <View style={styles.colPrice}><Text style={styles.tableHeaderText}>Birim Fiyat</Text></View>
                        <View style={styles.colTotal}><Text style={styles.tableHeaderText}>Tutar</Text></View>
                    </View>
                    {data.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.colDesc}><Text style={styles.tableCell}>{item.description}</Text></View>
                            <View style={styles.colQty}><Text style={styles.tableCell}>{item.quantity}</Text></View>
                            <View style={styles.colPrice}><Text style={styles.tableCell}>{formatCurrency(item.unitPrice, data.currency)}</Text></View>
                            <View style={styles.colTotal}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatCurrency(item.totalPrice, data.currency)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Ara Toplam</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>KDV (%{data.taxRate})</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.taxAmount, data.currency)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.finalTotal]}>
                        <Text style={[styles.totalLabel, { fontSize: 12, fontWeight: 'bold' }]}>GENEL TOPLAM</Text>
                        <Text style={styles.totalValueLarge}>{formatCurrency(data.total, data.currency)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Bu teklif bilişim sistemleri vasıtasıyla oluşturulmuştur. İslak imza gerektirmez.</Text>
                    <Text style={styles.footerText}>ProSektorWeb Yazılım ve Danışmanlık Hizmetleri</Text>
                </View>
            </Page>
        </Document>
    )
}
