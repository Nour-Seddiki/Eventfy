from fastapi import APIRouter, Path, UploadFile, File, HTTPException
from uuid import uuid4
from pathlib import Path as SysPath
from app.db.session import db_dependency 
from starlette import status 
from app.services.auth_service import user_dependency
from app.services.event_service import EventService
from app.schemas.event import eventRequest, eventUpdate



router = APIRouter(prefix="/Event" , tags=['Event'])
public_router = APIRouter(tags=['Event'])

@router.post("/create_event",status_code=status.HTTP_201_CREATED)
async def create_event(user:user_dependency , db:db_dependency , event_data:eventRequest):
    return EventService().create_event(user, db, event_data)

@router.get("/event_list",status_code=status.HTTP_200_OK)
async def list_all_events(user:user_dependency , db:db_dependency):
    return EventService().list_events(user,db)

@router.get("/get_event_by_id/{event_id}",status_code=status.HTTP_200_OK)
async def list_all_events(user:user_dependency , db:db_dependency,event_id:int=Path(gt=0)):
    return EventService().get_event_by_id(user,db,event_id)

@router.get("/list_event_by_location/{keyword}",status_code=status.HTTP_200_OK)
async def list_all_events_by_location(user:user_dependency , db:db_dependency,keyword):
    return EventService().search_events_by_location(user,db ,keyword)

@router.get("/list_event_by_title/{keyword}",status_code=status.HTTP_200_OK)
async def list_all_events_by_title(user:user_dependency , db:db_dependency,keyword):
    return EventService().search_events_by_title(user,db ,keyword)

@router.get("/list_event_by_category/{keyword}",status_code=status.HTTP_200_OK)
async def list_all_events_by_category(user:user_dependency , db:db_dependency,keyword):
    return EventService().search_events_by_category(user,db ,keyword)


@public_router.get("/events/trending", status_code=status.HTTP_200_OK)
async def trending_events(user:user_dependency, db:db_dependency, limit: int = 5):
    return EventService().trending_events(user, db, limit)

@public_router.get("/events/{event_id}/similar", status_code=status.HTTP_200_OK)
async def similar_events(user:user_dependency, db:db_dependency, event_id: int = Path(gt=0), limit: int = 5):
    return EventService().similar_events(user, db, event_id, limit)


@router.put("/update_event/{event_id}",status_code=status.HTTP_202_ACCEPTED)
async def update_event(user:user_dependency , db:db_dependency,data:eventUpdate,event_id:int=Path(gt=0)):
    return EventService().update_event(user,db,data,event_id)

@router.post("/event/{event_id}/image", status_code=status.HTTP_201_CREATED)
async def upload_event_image(
    user: user_dependency,
    db: db_dependency,
    event_id: int = Path(gt=0),
    image: UploadFile = File(...),
):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_suffix = SysPath(image.filename or "").suffix.lower()
    if file_suffix not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    uploads_dir = SysPath("uploads") / "events"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{uuid4().hex}{file_suffix}"
    file_path = uploads_dir / file_name

    with file_path.open("wb") as buffer:
        buffer.write(await image.read())

    public_path = f"/uploads/events/{file_name}"
    return EventService().upload_event_image(user, db, event_id, public_path)


@router.delete("/delete_event/{event_id}",status_code=status.HTTP_202_ACCEPTED)
async def delete_event(user:user_dependency,db:db_dependency , event_id:int=Path(gt=0)):
    return EventService().delete_event(user,db,event_id)

