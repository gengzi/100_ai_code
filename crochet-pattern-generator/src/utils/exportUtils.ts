import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CrochetPattern, ExportOptions } from '../types';

export class ExportUtils {
  /**
   * 导出为PDF
   */
  async exportToPDF(
    patternElement: HTMLElement,
    pattern: CrochetPattern,
    options: ExportOptions
  ): Promise<void> {
    // 生成canvas
    const canvas = await html2canvas(patternElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // 添加图片
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // 如果包含说明，添加新页面
    if (options.includeInstructions && pattern.instructions.length > 0) {
      pdf.addPage();
      await this.addInstructionsToPDF(pdf, pattern);
    }

    // 下载PDF
    pdf.save(`${pattern.name}_钩针图解.pdf`);
  }

  /**
   * 添加说明到PDF
   */
  private async addInstructionsToPDF(pdf: jsPDF, pattern: CrochetPattern): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 8;
    let yPosition = margin;

    // 标题
    pdf.setFontSize(20);
    pdf.text('编织说明', margin, yPosition);
    yPosition += lineHeight * 2;

    // 基本信息
    pdf.setFontSize(12);
    pdf.text(`尺寸: ${pattern.width} x ${pattern.height}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`每行针数: ${pattern.stitchesPerRow}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // 颜色图例
    pdf.setFontSize(14);
    pdf.text('颜色图例:', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(10);
    pattern.colors.forEach((color, index) => {
      pdf.text(`${index + 1}. ${color.name} (${color.hexCode})`, margin + 10, yPosition);
      yPosition += lineHeight;
    });

    yPosition += lineHeight;

    // 编织说明
    pdf.setFontSize(14);
    pdf.text('编织步骤:', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(10);
    pattern.instructions.forEach((instruction) => {
      // 检查是否需要新页面
      if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      const text = `第${instruction.row}行: ${instruction.instructions}`;
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);

      lines.forEach((line: string) => {
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    });
  }

  /**
   * 导出为图片
   */
  async exportToImage(
    patternElement: HTMLElement,
    pattern: CrochetPattern,
    options: ExportOptions
  ): Promise<void> {
    const canvas = await html2canvas(patternElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // 转换为指定格式
    const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = options.format === 'jpg' ? 0.9 : 1.0;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pattern.name}_钩针图解.${options.format}`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, mimeType, quality);
  }

  /**
   * 导出说明文本
   */
  exportInstructions(pattern: CrochetPattern): void {
    let content = `${pattern.name} - 钩针编织说明\n`;
    content += '=' .repeat(50) + '\n\n';

    content += `尺寸: ${pattern.width} x ${pattern.height}\n`;
    content += `每行针数: ${pattern.stitchesPerRow}\n`;
    content += `总行数: ${pattern.instructions.length}\n\n`;

    content += '颜色图例:\n';
    content += '-'.repeat(30) + '\n';
    pattern.colors.forEach((color, index) => {
      content += `${index + 1}. ${color.name} (${color.hexCode})\n`;
    });

    content += '\n编织步骤:\n';
    content += '-'.repeat(30) + '\n';
    pattern.instructions.forEach((instruction) => {
      content += `第${instruction.row}行: ${instruction.instructions}\n`;
    });

    // 下载文本文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pattern.name}_编织说明.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 打印图解
   */
  async printPattern(patternElement: HTMLElement): Promise<void> {
    const canvas = await html2canvas(patternElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const dataUrl = canvas.toDataURL();

    // 创建新窗口用于打印
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>钩针图解打印</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; padding: 0; }
                img { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="钩针图解" />
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  /**
   * 分享图解
   */
  async sharePattern(patternElement: HTMLElement, pattern: CrochetPattern): Promise<void> {
    if (navigator.share) {
      try {
        const canvas = await html2canvas(patternElement, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `${pattern.name}_钩针图解.png`, { type: 'image/png' });

            await navigator.share({
              title: pattern.name,
              text: '查看我的钩针图解作品！',
              files: [file]
            });
          }
        });
      } catch (error) {
        console.error('分享失败:', error);
        this.shareViaLink(pattern);
      }
    } else {
      this.shareViaLink(pattern);
    }
  }

  /**
   * 通过链接分享
   */
  private shareViaLink(pattern: CrochetPattern): void {
    const shareData = {
      title: pattern.name,
      text: '查看我的钩针图解作品！',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('链接已复制到剪贴板！');
      });
    }
  }
}

export const exportUtils = new ExportUtils();