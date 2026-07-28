export default function PainelJogo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="painel">
      <h1>{titulo}</h1>
      {children}
    </section>
  );
}
