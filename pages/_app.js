import React from 'react'
import '../styles/globals.css'
import PropTypes from 'prop-types'
function GLTFModelViewer({ Component, pageProps }) {
  return <Component {...pageProps} />
}
GLTFModelViewer.propTypes = {
  Component: PropTypes.element.isRequired,
  pageProps: PropTypes.any.isRequired,
}

export default GLTFModelViewer
