export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 text-center border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </div>
        <p>&copy; {new Date().getFullYear()} Vision House Eye Hospital. All rights reserved.</p>
      </div>
    </footer>
  );
}
