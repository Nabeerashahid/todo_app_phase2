from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

app = FastAPI()
security = HTTPBearer()

# =====================
# JWT CONFIG
# =====================
SECRET_KEY = "super-secret-key-123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# =====================
# MODELS
# =====================
class Login(BaseModel):
    email: str
    password: str

class Task(BaseModel):
    id: Optional[int]
    user_id: str
    title: str
    description: Optional[str] = ""
    completed: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# =====================
# IN-MEMORY DB (testing)
# =====================
tasks_db = []
task_counter = 1

# =====================
# FAKE USER (testing)
# =====================
fake_user = {
    "id": "user123",
    "email": "admin@gmail.com",
    "password": "1234",
}

# =====================
# JWT FUNCTIONS
# =====================
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

# =====================
# LOGIN ROUTE
# =====================
@app.post("/api/login")
def login(data: Login):
    if data.email == fake_user["email"] and data.password == fake_user["password"]:
        token = create_access_token({"sub": fake_user["id"], "email": data.email})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid email or password")

# =====================
# TASK CRUD
# =====================

@app.get("/api/{user_id}/tasks", response_model=List[Task])
def get_tasks(user_id: str, user=Depends(verify_jwt)):
    if user_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return [task for task in tasks_db if task["user_id"] == user_id]

@app.post("/api/{user_id}/tasks", response_model=Task)
def create_task(user_id: str, task: Task, user=Depends(verify_jwt)):
    global task_counter
    if user_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")
    task.id = task_counter
    task.created_at = datetime.utcnow().isoformat()
    task.updated_at = datetime.utcnow().isoformat()
    task_counter += 1
    task.user_id = user_id
    tasks_db.append(task.dict())
    return task

@app.put("/api/{user_id}/tasks/{task_id}", response_model=Task)
def update_task(user_id: str, task_id: int, updated_task: Task, user=Depends(verify_jwt)):
    if user_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")
    for task in tasks_db:
        if task["id"] == task_id and task["user_id"] == user_id:
            task.update({
                "title": updated_task.title,
                "description": updated_task.description,
                "completed": updated_task.completed,
                "updated_at": datetime.utcnow().isoformat()
            })
            return task
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/api/{user_id}/tasks/{task_id}")
def delete_task(user_id: str, task_id: int, user=Depends(verify_jwt)):
    if user_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")
    global tasks_db
    tasks_db = [task for task in tasks_db if not (task["id"] == task_id and task["user_id"] == user_id)]
    return {"detail": "Task deleted"}

@app.patch("/api/{user_id}/tasks/{task_id}/complete", response_model=Task)
def toggle_complete(user_id: str, task_id: int, user=Depends(verify_jwt)):
    if user_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")
    for task in tasks_db:
        if task["id"] == task_id and task["user_id"] == user_id:
            task["completed"] = not task["completed"]
            task["updated_at"] = datetime.utcnow().isoformat()
            return task
    raise HTTPException(status_code=404, detail="Task not found")
