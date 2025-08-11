from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Nowl FastAPI backend is running!"}