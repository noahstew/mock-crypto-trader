function Footer() {
  return (
    <div className="border-neutral-300 border-t-2 text-center py-16">
      <div className="text-2xl mb-2">
        a project by{' '}
        <a
          href="https://nostew.com"
          target="_blank"
          rel="noreferrer"
          className="text-yellow-400 font-bold"
        >
          &lt;nostew/&gt;
        </a>
      </div>
      <div className="text-sm text-slate-400">
        favicon by{' '}
        <a
          href="https://www.flaticon.com/authors/kerismaker"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-slate-300"
        >
          kerismaker
        </a>
      </div>
    </div>
  );
}

export default Footer;
