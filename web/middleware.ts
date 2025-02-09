import _ from "lodash";
import { NextRequest, NextResponse } from "next/server";
import { GetRootMenuURL } from "./features/domain/config";

interface IMiddleware {
    handle(request: NextRequest): NextResponse | void
    config?: {
        matcher?: string | string[] | RegExp
    }
}

const authMiddleware = (request: NextRequest) => {
    const token = request.cookies.get("access_token")?.value; // Check auth token
    if (!token) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
}

const logMiddleware = (req: NextRequest) => {
    return NextResponse.next();
}

export function middleware(req: NextRequest) {
    if ((req.nextUrl.pathname === "/signin" || req.nextUrl.pathname === "/") && req.cookies.get("access_token")?.value) {
        return NextResponse.redirect(new URL(GetRootMenuURL(), req.url))
    }

    const middlewares: IMiddleware[] = [
        {
            handle: authMiddleware,
            config: {
                matcher: "/((?!signin).*)"
            }
        },
        {
            handle: logMiddleware,
        }
    ]

    for (const mw of middlewares) {
        // Check matcher and call middleware handler
        const { matcher } = mw.config || {};
        let matchRegExp: RegExp | null = null;

        if (matcher) {
            if (Array.isArray(matcher)) {
                matchRegExp = new RegExp(matcher.join("|"));
            } else if (typeof matcher === "string" || matcher instanceof RegExp) {
                matchRegExp = new RegExp(matcher instanceof RegExp ? matcher.source : matcher);
            } 
        }

        if (matchRegExp && req.nextUrl.pathname.match(matchRegExp) || matcher === undefined) {
            const response = mw.handle(req); // Execute middleware
            if (response) {
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
            * Match all request paths except for the ones starting with:
            * - api (API routes)
            * - _next/static (static files)
            * - _next/image (image optimization files)
            * - favicon.ico, sitemap.xml, robots.txt (metadata files)
        */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public|images).*)',
    ],
};
