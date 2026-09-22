type Props = {
  title: string
  description: string
}

export default function TableBanner({ title, description }: Props) {
  return (
    <header className="table-banner">
      <h3>{title}</h3>
      <p>{description}</p>
    </header>
  )
}
