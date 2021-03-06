import React from 'react';
require('pdfjs-dist/build/pdf.combined');

class Pdf extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onDocumentComplete = this.onDocumentComplete.bind(this);
    this.onPageComplete = this.onPageComplete.bind(this);
  }

  componentDidMount() {
    this.loadPDFDocument(this.props);
    this.renderPdf();
  }

  componentWillReceiveProps(newProps) {
    const { pdf } = this.state;
    if ((newProps.file && newProps.file !== this.props.file) ||
      (newProps.content && newProps.content !== this.props.content)) {
      this.loadPDFDocument(newProps);
    }

    if (pdf && ((newProps.page && newProps.page !== this.props.page) ||
      (newProps.scale && newProps.scale !== this.props.scale))) {
      this.setState({ page: null });
      pdf.getPage(newProps.page).then(this.onPageComplete);
    }
  }

  onDocumentComplete(pdf) {
    this.setState({ pdf });
    const { onDocumentComplete } = this.props;
    if (typeof onDocumentComplete === 'function') {
      onDocumentComplete(pdf.numPages);
    }
    pdf.getPage(this.props.page).then(this.onPageComplete);
  }

  onPageComplete(page) {
    this.setState({ page });
    this.renderPdf();
    const { onPageComplete } = this.props;
    if (typeof onPageComplete === 'function') {
      onPageComplete(page.pageIndex + 1);
    }
  }

  loadByteArray(byteArray) {
    window.PDFJS.getDocument(byteArray).then(this.onDocumentComplete);
  }

  loadPDFDocument(props) {
    if (!!props.file) {
      if (typeof props.file === 'string') {
        return window.PDFJS.getDocument(props.file)
          .then(this.onDocumentComplete);
      }
      // Is a File object
      const reader = new FileReader();
      reader.onloadend = () =>
        this.loadByteArray(new Uint8Array(reader.result));
      reader.readAsArrayBuffer(props.file);
    } else if (!!props.content) {
      const bytes = window.atob(props.content);
      const byteLength = bytes.length;
      const byteArray = new Uint8Array(new ArrayBuffer(byteLength));
      for (let index = 0; index < byteLength; index++) {
        byteArray[index] = bytes.charCodeAt(index);
      }
      this.loadByteArray(byteArray);
    } else {
      throw new Error('react-pdf-js works with a file(URL) or (base64)content. At least one needs to be provided!');
    }
  }

  renderPdf() {
    const { page } = this.state;
    if (page) {
      const { canvas } = this.refs;
      const canvasContext = canvas.getContext('2d');
      const { scale } = this.props;
      const viewport = page.getViewport(scale);
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      page.render({ canvasContext, viewport });
    }
  }

  render() {
    const { loading } = this.props;
    const { page } = this.state;
    return page ? <canvas ref="canvas" /> : loading || <div>Loading PDF...</div>;
  }
}
Pdf.displayName = 'react-pdf-js';
Pdf.propTypes = {
  content: React.PropTypes.string,
  file: React.PropTypes.string,
  loading: React.PropTypes.any,
  page: React.PropTypes.number,
  scale: React.PropTypes.number,
  onDocumentComplete: React.PropTypes.func,
  onPageComplete: React.PropTypes.func,
};
Pdf.defaultProps = { page: 1, scale: 1.0 };

export default Pdf;
