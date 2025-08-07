import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-gray-50 to-white py-16 border-t border-gray-200">
            <div className="container mx-auto px-8">
                <div className="grid md:grid-cols-3 gap-12 items-center">
                    {/* Brand */}
                    <div className="text-center md:text-left">
                        <Link href="/" className="font-black text-3xl text-blue-900 tracking-tight">
                            eclero
                        </Link>
                        <p className="mt-2 text-gray-600 text-sm">
                            Connecting minds, enabling success
                        </p>
                    </div>
                    
                    {/* Links */}
                    <div className="flex justify-center md:justify-center gap-8">
                        <Link href="#" className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="#" className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            Contact
                        </Link>
                    </div>
                    
                    {/* Copyright */}
                    <div className="text-center md:text-right">
                        <p className="text-sm text-gray-600">
                            &copy; {new Date().getFullYear()} Eclero. All rights reserved.
                        </p>
                        <div className="mt-2 flex justify-center md:justify-end gap-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
