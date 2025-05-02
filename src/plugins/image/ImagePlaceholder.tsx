import React from 'react'
import { ImageIcon } from '@radix-ui/react-icons'

import styles from '../../styles/ui.module.css'

export const ImagePlaceholder: React.FC = () => {
  return (
    <div className={styles.imagePlaceholder}>
      <ImageIcon />
    </div>
  )
}
