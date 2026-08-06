from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.routers import auth, providers, categories, bookings, reviews, admin, identity, witness, jobs, notifications
from app.services.provider_service import get_platform_stats
from app.database import get_db
import os

app = FastAPI(title='Sajilo Sewa API', version='1.0.0')

# CLIENT_URL may be a single origin or a comma-separated list (e.g. prod + local dev).
_client_urls = [u.strip() for u in os.getenv('CLIENT_URL', 'http://localhost:5173').split(',') if u.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_client_urls,
    allow_origin_regex=r'https://.*\.vercel\.app',  # Vercel preview deployments
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(providers.router, prefix='/api/providers', tags=['providers'])
app.include_router(categories.router, prefix='/api/categories', tags=['categories'])
app.include_router(bookings.router, prefix='/api/bookings', tags=['bookings'])
app.include_router(reviews.router, prefix='/api/reviews', tags=['reviews'])
app.include_router(admin.router, prefix='/api/admin', tags=['admin'])
app.include_router(identity.router, prefix='/api/identity', tags=['identity'])
app.include_router(witness.router, prefix='/api/witnesses', tags=['witnesses'])
app.include_router(jobs.router, prefix='/api/jobs', tags=['jobs'])
app.include_router(notifications.router, prefix='/api/notifications', tags=['notifications'])


@app.get('/')
def health():
    return {'status': 'ok', 'version': '1.0.0'}


@app.get('/api/statistics')
def platform_statistics(db: Session = Depends(get_db)):
    return get_platform_stats(db)


from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected errors — never expose Python stack traces to the client."""
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={'success': False, 'message': exc.detail},
        )
    print(f"Unhandled Exception: {exc}") # Print the actual error for debugging
    return JSONResponse(
        status_code=500,
        content={'success': False, 'message': 'Internal server error'},
    )

# uvicorn app.main:app --reload
