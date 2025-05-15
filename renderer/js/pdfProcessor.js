// PDF processing utility functions
const PDFProcessor = {
  /**
   * Extracts text content from a base64-encoded PDF
   * @param {string} pdfBase64 - Base64-encoded PDF data
   * @returns {Promise<string>} - Extracted text content
   */
  extractText: async function(pdfBase64) {
    try {
      // Convert base64 to array buffer
      const pdfData = atob(pdfBase64);
      const pdfBytes = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        pdfBytes[i] = pdfData.charCodeAt(i);
      }
      
      // Load PDF using pdf.js
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      
      // Get total number of pages
      const numPages = pdf.numPages;
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Concatenate the text items
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  },
  
  /**
   * Extracts structure information (headings, sections) from a PDF
   * @param {string} pdfText - Extracted text from PDF
   * @returns {Object} - Structure information
   */
  extractStructure: function(pdfText) {
    // Split text into lines
    const lines = pdfText.split('\n').filter(line => line.trim().length > 0);
    
    // Identify chapter headings and sections
    const structure = {
      title: '',
      chapters: []
    };
    
    let currentChapter = null;
    let currentSection = null;
    
    // Find title (usually at the beginning)
    if (lines.length > 0) {
      structure.title = lines[0].trim();
    }
    
    // Process each line to identify structure
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for chapter heading (usually starts with "Chapter" or contains numbers like "1.")
      const chapterMatch = line.match(/^(Chapter\s+\d+[\.:]\s*|[IVX]+\.\s+|[\d]+\.\s+)(.+)$/i);
      if (chapterMatch) {
        currentChapter = {
          title: chapterMatch[2].trim(),
          number: chapterMatch[1].trim(),
          sections: [],
          content: ''
        };
        structure.chapters.push(currentChapter);
        currentSection = null;
        continue;
      }
      
      // Check for section heading (usually has a pattern like "1.1" or is denoted by indentation)
      const sectionMatch = line.match(/^(\d+\.\d+[\.:]\s*|[\d]+\.\d+\.\s+)(.+)$/i);
      if (sectionMatch && currentChapter) {
        currentSection = {
          title: sectionMatch[2].trim(),
          number: sectionMatch[1].trim(),
          content: ''
        };
        currentChapter.sections.push(currentSection);
        continue;
      }
      
      // Add content to current section or chapter
      if (currentSection) {
        currentSection.content += line + '\n';
      } else if (currentChapter) {
        currentChapter.content += line + '\n';
      }
    }
    
    return structure;
  },
  
  /**
   * Extracts table of contents from PDF text
   * @param {string} pdfText - Extracted text from PDF
   * @returns {Array} - Array of TOC entries
   */
  extractTableOfContents: function(pdfText) {
    // Look for "Contents" section and extract entries
    const contentsMatch = pdfText.match(/Contents[\s\S]*?(Chapter|I\.|1\.)/i);
    
    if (!contentsMatch) {
      return [];
    }
    
    const contentsSection = contentsMatch[0];
    const tocEntries = [];
    
    // Extract entries from contents section
    const lines = contentsSection.split('\n');
    
    for (const line of lines) {
      // Look for lines that have a page number at the end
      const tocMatch = line.match(/^(.*?)(\d+)$/);
      if (tocMatch) {
        const title = tocMatch[1].trim();
        const page = parseInt(tocMatch[2]);
        
        if (title && !isNaN(page)) {
          tocEntries.push({ title, page });
        }
      }
    }
    
    return tocEntries;
  }
};
