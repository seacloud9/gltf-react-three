import React from 'react'
import theme from 'prism-react-renderer/themes/nightOwlLight'
import Highlight, { defaultProps } from 'prism-react-renderer'
import PropTypes from 'prop-types'

const Code = ({ children }) => {
  return (
    <Highlight {...defaultProps} theme={theme} code={children} language="jsx">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} whitespace-pre-wrap col-span-3 p-16 overflow-auto bg-white h-full`}
          style={{
            ...style,
            fontSize: 12,
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

Code.propTypes = {
  children: PropTypes.element.isRequired,
}

export default Code
