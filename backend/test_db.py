import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(r'd:\Eventfy-Pro\backend\.env'), override=True)

print('DB_HOST:', os.getenv('DB_HOST'))
print('DB_PORT:', os.getenv('DB_PORT'))
print('DB_USER:', os.getenv('DB_USER'))
print('DB_PASSWORD:', repr(os.getenv('DB_PASSWORD')))
print('DB_NAME:', os.getenv('DB_NAME'))

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.pool import NullPool

url = URL.create(
    drivername="postgresql+psycopg2",
    username=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    host=os.getenv('DB_HOST'),
    port=int(os.getenv('DB_PORT', '5432')),
    database=os.getenv('DB_NAME'),
)
print('\nSQLAlchemy URL:', str(url)[:80], '...')

engine = create_engine(url, poolclass=NullPool)
try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT count(*) FROM public.users'))
        print('\nSUCCESS! Users count:', result.scalar())
except Exception as e:
    print('\nERROR:', str(e)[:300])
