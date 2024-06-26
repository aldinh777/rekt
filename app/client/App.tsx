import type { Context, Props } from '@aldinh777/rekt-jsx'
import { asyncUtils } from '@aldinh777/rekt-jsx/context-utils'
import { computed } from '@aldinh777/reactive/utils'
import { randomItem } from '@aldinh777/toolbox/random'
import { state } from '@aldinh777/reactive'

const randomName = () => randomItem(['mom', 'father', 'mama', 'bunda', 'world'])
const randomColor = () => randomItem(['red', 'green', 'blue', 'yellow'])

export default function (_: Props, context: Context) {
    const { setInterval } = asyncUtils(context)
    
    const who = state(randomName())
    const color = state(randomColor())
    const styleColor = computed(() => `color: ${color()}`)

    setInterval(() => {
        who(randomName())
        color(randomColor())
    }, 1000)

    return (
        <h3>
            Hello, <span style={styleColor}>{who}</span>
        </h3>
    )
}
