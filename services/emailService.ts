
import { ScheduledReport } from '../types';

export class EmailService {
  private static API_BASE = '/api/email';

  /**
   * SMTP Yapılandırmasını test eder (sureyyaerat@gmail.com'a test maili gönderir)
   */
  static async testSmtpConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: 'sureyyaerat@gmail.com' })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'SMTP Test hatası');
      
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Gerçek bir raporu SMTP üzerinden gönderir
   */
  static async sendReport(report: ScheduledReport, datasetSummary: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: report.email,
          subject: `InsightStream Raporu: ${report.datasetName} (${report.reportType.toUpperCase()})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #4f46e5;">InsightStream AI Raporu</h2>
              <p>Merhaba,</p>
              <p><strong>${report.datasetName}</strong> verisetine ait zamanlanmış <strong>${report.reportType === 'manager' ? 'Yönetici Özeti' : 'Detaylı'}</strong> raporunuz hazır.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; font-size: 14px;">Veri Özeti:</h3>
                <p style="font-size: 13px; color: #64748b;">${datasetSummary}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">Bu rapor otomatik olarak ${report.frequency} periyodunda gönderilmektedir.</p>
            </div>
          `
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gönderim başarısız.');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
