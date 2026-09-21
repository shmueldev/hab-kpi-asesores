from fastapi import APIRouter, Depends

from app.domain.models import UserInfo
from app.infrastructure.api.dependencies import get_current_user
from app.use_cases.chat import ChatRequest, ChatResponse, answer_chat

chat_router = APIRouter(tags=["chat"])


@chat_router.post("/chat", response_model=ChatResponse)
def post_chat(
    body: ChatRequest,
    user: UserInfo = Depends(get_current_user),
) -> ChatResponse:
    _ = user
    return answer_chat(body)
