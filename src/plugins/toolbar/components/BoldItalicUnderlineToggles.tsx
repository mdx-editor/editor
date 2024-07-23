import {applyFormat$, currentFormat$, iconComponentFor$, useTranslation} from '../../core'
import {useCellValues, usePublisher} from '@mdxeditor/gurx'
import React, {useEffect, useState} from 'react'
import {
    FORMAT,
    IS_BOLD,
    IS_ITALIC,
    IS_STRIKETHROUGH,
    IS_SUBSCRIPT,
    IS_SUPERSCRIPT,
    IS_UNDERLINE
} from '../../../FormatConstants'
import {MultipleChoiceToggleGroup, SingleChoiceToggleGroup, ToggleSingleGroupWithItem} from '.././primitives/toolbar'
import {TextFormatType} from 'lexical'
import styles from '../../../styles/ui.module.css'
import {IconKey} from '../../../defaultSvgIcons'

interface FormatButtonProps {
    format: FORMAT
    addTitle: string
    removeTitle: string
    icon: IconKey
    formatName: TextFormatType
}

const FormatButton: React.FC<FormatButtonProps> = ({format, addTitle, removeTitle, icon, formatName}) => {
    const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
    const applyFormat = usePublisher(applyFormat$)
    const active = (currentFormat & format) !== 0

    return (
        <ToggleSingleGroupWithItem
            title={active ? removeTitle : addTitle}
            on={active}
            onValueChange={() => {
                applyFormat(formatName)
            }}
        >
            {iconComponentFor(icon)}
        </ToggleSingleGroupWithItem>
    )
}

export interface BoldItalicUnderlineTogglesProps {
    options?: ('Bold' | 'Italic' | 'Underline')[]
}

/**
 * A toolbar component that lets the user toggle bold, italic and underline formatting.
 * @group Toolbar Components
 */
export const BoldItalicUnderlineToggles: React.FC<BoldItalicUnderlineTogglesProps> = ({options}) => {
    const t = useTranslation()
    const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
    const applyFormat = usePublisher(applyFormat$)

    const showAllButtons = typeof options === 'undefined'
    const isBold = (currentFormat & IS_BOLD) !== 0
    const isItalic = (currentFormat & IS_ITALIC) !== 0
    const isUnderline = (currentFormat & IS_UNDERLINE) !== 0

    const [appliedFormats, setAppliedFormats] = useState<string[]>([])
    useEffect(() => {
        setAppliedFormats(
            [
                isBold ? 'bold' : null,
                isItalic ? 'italic' : null,
                isUnderline ? 'underline' : null
            ].filter((f) => !!f) as TextFormatType[]
        )
    }, [currentFormat])
    const handleApplyFormatDiff = (diff: string[]) => (diff as TextFormatType[]).forEach(applyFormat)

    return (
        <div className={styles.toolbarGroupOfGroups}>
            <MultipleChoiceToggleGroup
                value={appliedFormats}
                onValueChange={setAppliedFormats}
                onValueChangeDiff={handleApplyFormatDiff}
                items={[
                    ...(showAllButtons || options.includes('Bold') ? [{
                        title: isBold ? t('toolbar.removeBold', 'Remove bold') : t('toolbar.bold', 'Bold'),
                        contents: iconComponentFor('format_bold'),
                        value: 'bold',
                    }] : []),
                    ...(showAllButtons || options.includes('Italic') ? [{
                        title: isItalic ? t('toolbar.italic', 'Remove italic') : t('toolbar.italic', 'Italic'),
                        contents: iconComponentFor('format_italic'),
                        value: 'italic',
                    }] : []),
                    ...(showAllButtons || options.includes('Underline') ? [{
                        title: isItalic ? t('toolbar.underline', 'Remove underline') : t('toolbar.underline', 'Underline'),
                        contents: iconComponentFor('format_underlined'),
                        value: 'underline',
                    }] : []),
                ]}/>
        </div>
    )
}

export interface StrikeThroughSupSubTogglesProps {
    options?: ('Strikethrough' | 'Sub' | 'Sup')[]
}

const SupSubRadioItems = {
    Sup: {
        icon: 'superscript',
        formatName: 'superscript' as TextFormatType,
        titleFormatKey: 'toolbar.superscript',
        titleFormatDefaultTranslation: 'Superscript',
        titleRemoveFormatKey: 'toolbar.removeSuperscript',
        titleRemoveFormatDefaultTranslation: 'Remove superscript',
    },
    Sub: {
        icon: 'subscript',
        formatName: 'subscript' as TextFormatType,
        titleFormatKey: 'toolbar.subscript',
        titleFormatDefaultTranslation: 'Subscript',
        titleRemoveFormatKey: 'toolbar.removeSubscript',
        titleRemoveFormatDefaultTranslation: 'Remove subscript',
    }
}
const isSupSubRadioItemsKey = (key: string): key is keyof typeof SupSubRadioItems => Object.keys(SupSubRadioItems).includes(key)
/**
 * A toolbar component that lets the user toggle strikeThrough, superscript and subscript formatting.
 * @group Toolbar Components
 */
export const StrikeThroughSupSubToggles: React.FC<StrikeThroughSupSubTogglesProps> = ({options}) => {
    const t = useTranslation()
    const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
    const applyFormat = usePublisher(applyFormat$)

    const isSup = (currentFormat & IS_SUPERSCRIPT) !== 0
    const isSub = (currentFormat & IS_SUBSCRIPT) !== 0

    const [radioValue, setRadioValue] = useState<keyof typeof SupSubRadioItems | ''>('')
    const radioItems = (options || Object.keys(SupSubRadioItems))
        .filter(isSupSubRadioItemsKey)
        .map((type) => {
            const item = SupSubRadioItems[type]
            return ({
                value: type,
                title: radioValue !== type ? t(item.titleFormatKey, item.titleFormatDefaultTranslation) : t(item.titleRemoveFormatKey, item.titleRemoveFormatDefaultTranslation),
                contents: iconComponentFor(item.icon as IconKey)
            });
        })
    useEffect(() => {
        if (isSup) {
            setRadioValue("Sup")
        } else if (isSub) {
            setRadioValue("Sub")
        } else {
            setRadioValue('')
        }
    }, [currentFormat])

    const handleRadioItemChange = (newValue: keyof typeof SupSubRadioItems | '') => {
        if (newValue) {
            applyFormat(SupSubRadioItems[newValue].formatName)
        } else if (radioValue) {
            applyFormat(SupSubRadioItems[radioValue].formatName)
        }
        setRadioValue(newValue)
    }

    const showAllButtons = typeof options === 'undefined'

    return (
        <>
            <div className={styles.toolbarGroupOfGroups}>
                {showAllButtons || options.includes('Strikethrough') ? (
                    <FormatButton
                        format={IS_STRIKETHROUGH}
                        addTitle={t('toolbar.strikethrough', 'Strikethrough')}
                        removeTitle={t('toolbar.removeStrikethrough', 'Remove strikethrough')}
                        icon="strikeThrough"
                        formatName="strikethrough"
                    />
                ) : null}
            </div>
            <SingleChoiceToggleGroup aria-label={t('toolbar.supSubRadio', 'Superscript / subscript formatting')} value={radioValue} items={radioItems} onChange={handleRadioItemChange}/>
        </>
    )
}
