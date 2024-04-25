import type { Props, ServerContext } from '@aldinh777/rekt-jsx'

export const metadata = {
    title: ''
}

export default function BlogPage(_props: Props, context: ServerContext) {
    const title = context.params['slug']!

    metadata.title = title

    return (
        <>
            <h3>{title}</h3>
            <p>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit. Sequi in iste earum quis rem assumenda
                eligendi? Quam praesentium repudiandae itaque explicabo ducimus, tenetur incidunt ab culpa? Voluptatem
                reprehenderit cum laborum.
            </p>
        </>
    )
}
