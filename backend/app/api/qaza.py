from fastapi import APIRouter, HTTPException
from app.database.qaza_stats import get_total_qazas, get_prayers_stats,get_user_info,qazas_rating,get_weekly_activity, get_profile_quote, get_monthly_data
from app.database.database import add_prayer, add_qaza, add_bulk_qazas, mark_qazas_prayed
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal

router = APIRouter()

@router.get("/total/{userId}")
def total_qazas(userId: int):
    try:
        total = get_total_qazas(userId)
        return {"total_qazas": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get('/breakdown/{userId}')
def get_qazas_stats(userId:int):
    try:
        stats=qazas_rating(userId)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/stats/{userId}")
def get_stats(userId: int):
    try:
        stats=get_prayers_stats (userId)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    

    
    

@router.get('/user_info/{userId}')
def get_user(userId: int):
    try:
        info=get_user_info(userId)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    
    
@router.get("/activity/weekly/{userId}")
def get_weekly_stats(userId: int):
    try:
        weekly=get_weekly_activity(userId)
        return weekly
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/quotes")
def get_quotes():
    try:
        quote=get_profile_quote()
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/calendar/{userId}")
def get_calendar_page(userId: int, year: int, month: int):
    try:
        monthly = get_monthly_data(userId, year, month)
        return monthly
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Request models
class PrayerLog(BaseModel):
    prayer: Literal['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
    status: Literal['completed', 'missed']
    reason: Optional[str] = None
    
    @validator('reason')
    def validate_reason(cls, v, values):
        # If status is missed and no reason, it's ok (reason is optional)
        # If status is completed, reason should be None
        if values.get('status') == 'completed' and v is not None:
            raise ValueError('reason should not be provided for completed prayers')
        return v

class AdaLogRequest(BaseModel):
    user_id: int = Field(..., gt=0, description="User ID must be positive")
    prayers: List[PrayerLog] = Field(..., min_items=1, description="At least one prayer required")

class AdaLogResponse(BaseModel):
    success: bool
    message: str

# Endpoint
@router.post('/log/ada', response_model=AdaLogResponse)
async def log_ada_prayers(request: AdaLogRequest):
    try:
        # Process each prayer
        for prayer_data in request.prayers:
            if prayer_data.status == 'completed':
                add_prayer(prayer_data.prayer, request.user_id)
            elif prayer_data.status == 'missed':
                add_qaza(prayer_data.prayer, request.user_id, prayer_data.reason)
        
        return AdaLogResponse(
            success=True,
            message='Ada prayers logged successfully'
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Error logging prayers: {str(e)}'
        )
        
class BulkQazaRequest(BaseModel):
    user_id: int = Field(..., gt=0, description="User ID must be positive")
    fajr: int = Field(default=0, ge=0, description="Number of Fajr qazas to add")
    dhuhr: int = Field(default=0, ge=0, description="Number of Dhuhr qazas to add")
    asr: int = Field(default=0, ge=0, description="Number of Asr qazas to add")
    maghrib: int = Field(default=0, ge=0, description="Number of Maghrib qazas to add")
    isha: int = Field(default=0, ge=0, description="Number of Isha qazas to add")


class BulkQazaResponse(BaseModel):
    success: bool
    message: str


@router.post('/log/qaza', response_model=BulkQazaResponse)
async def log_bulk_qazas(request: BulkQazaRequest):
    try:
        # Add bulk qazas to database
        add_bulk_qazas(
            user_id=request.user_id,
            fajr=request.fajr,
            dhuhr=request.dhuhr,
            asr=request.asr,
            maghrib=request.maghrib,
            isha=request.isha
        )
        
        return BulkQazaResponse(
            success=True,
            message='Qaza prayers logged successfully'
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Error logging qaza prayers: {str(e)}'
        )
        
        


class ClearQazaRequest(BaseModel):
    user_id: int = Field(..., gt=0, description="User ID must be positive")
    fajr: int = Field(default=0, ge=0, description="Number of Fajr qazas to clear")
    dhuhr: int = Field(default=0, ge=0, description="Number of Dhuhr qazas to clear")
    asr: int = Field(default=0, ge=0, description="Number of Asr qazas to clear")
    maghrib: int = Field(default=0, ge=0, description="Number of Maghrib qazas to clear")
    isha: int = Field(default=0, ge=0, description="Number of Isha qazas to clear")


class ClearQazaResponse(BaseModel):
    success: bool
    message: str


@router.post('/mark_prayed', response_model=ClearQazaResponse)
async def mark_qazas_as_prayed(request: ClearQazaRequest):
    try:
        # Mark qazas as prayed
        mark_qazas_prayed(
            user_id=request.user_id,
            fajr=request.fajr,
            dhuhr=request.dhuhr,
            asr=request.asr,
            maghrib=request.maghrib,
            isha=request.isha
        )
        
        return ClearQazaResponse(
            success=True,
            message='Qaza prayers marked as prayed'
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Error marking qazas as prayed: {str(e)}'
        )