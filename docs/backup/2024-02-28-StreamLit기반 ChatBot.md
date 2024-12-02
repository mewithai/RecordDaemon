---
excerpt: "StreamLit과 Langchain을 연결시키고 코드를 파헤쳐보자."
toc: true
toc_sticky: true
toc_label: "StreamLit 활용 ChatBot"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
---

## 배경과 목표

- StreamLit을 활용해서 ChatBot을 만들어보자.
- StremaLit의 구조를 파악하고 써먹을 방안을 고민하자.

## 설치 및 기본 정보

- `StreamLit`은 `pip`를 이용해서 설치하면 된다.
- Raspberry Pi Docker위에 BookWorm Container를 만들고 Virtual Environment생성, `pip install streamlit`을 실행하였다.
- 만약 Rasberry Pi OS가 32bit일 경우 `PyArrow`가 설치되지 않았다. 64 Bit 이어야 한다.
- StreamLit은 다음의 명령어 실행한다 `streamlit run ######.py`
- StreamLit은 `8051` Port로 Web 서비스를 연다.

나는 Host OS에 ssh 접속 및 Tunneling을 통해서 StreamLit에 접속하였다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240228153308.png)

## Full Code

- OpenAI의 API Key는 `dotenv` Module을 활용하여 전달 하였다. `.env` 파일에 `OPENAI_API_KEY = sk-*******` 형식으로 API를 전달하면 된다.
- 코드는 그냥 StreamLit 홈페이지에서 그대로 복사 붙이기를 하였다. 
  참고: [build-a-chatgpt-like-app](https://docs.streamlit.io/knowledge-base/tutorials/build-conversational-apps#build-a-chatgpt-like-app)

```python
from openai import OpenAI
import streamlit as st
## Load Config
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

## Log Setting
import coloredlogs, logging
logger = logging.getLogger(__name__)
coloredlogs.install(level='DEBUG')
logging.basicConfig(
    level=logging.DEBUG, 
    format='%(name)s - %(levelname)s - %(message)s'
)

st.title("ChatGPT Clone 001")

client = OpenAI()

if "openai_model" not in st.session_state:
    st.session_state["openai_model"] = "gpt-3.5-turbo"

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("What is up?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        stream = client.chat.completions.create(
            model=st.session_state["openai_model"],
            messages=[
                {"role": m["role"], "content": m["content"]}
                for m in st.session_state.messages
            ],
            stream=True,
        )
        response = st.write_stream(stream)

        
    st.session_state.messages.append({"role": "assistant", "content": response})
```

## Code별 설명

Code별로 살펴보자.

### title

`st.title("ChatGPT Clone 001")` 는 상단 타이틀

### llm

`client = OpenAI()`는 LLM을 선언하는 것

### session_state

```python
if "openai_model" not in st.session_state:
    st.session_state["openai_model"] = "gpt-3.5-turbo"

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
```

`st.session_state`는 상태를 저장. 위의 예시에선

- st.session_state.openai_model
- st.session_state.messages
- st.session_state.chat_messages

Session State에 대한 설명은 [공식홈](https://docs.streamlit.io/library/api-reference/session-state)을 참고

Session State는 Session에 대해서 `변수를 공유`하고 `설정된 상태를 유지` 시키고 `Callback을 활용`할 수 있게 해준다. 거기에 MultiPage APP을 만들었을때도 상태가 유지되게 한다.

걍 Python Dictionary로 값을 저장하고 불러쓰거나 Update 하는 것

```python
# 저장
if 'key' not in st.session_state:
    st.session_state['key'] = 'value'
    #or
    st.session_state.key = 'value'

# 부르기 
st.session_state.key 

# 업데이트
st.session_state['key'] = 'value'
#or
st.session_state.key = 'value'

# Delete
# Delete a single key-value pair
del st.session_state[key]
```

결국 위에서 본 `st.session_state.openai_model`와 `st.session_state.messages` 그리고 `st.session_state.chat_messages`는 변수를 Session에서 유지하는 것

디버그를 해보면 쉽게 Class를 확인해 볼 수 있을 듯

**참고** StreamLit Debug하기 [참고](https://stackoverflow.com/questions/60172282/how-to-run-debug-a-streamlit-application-from-an-ide)

### chat_message

```python
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
```

streamlit에서 하나하나의 ChatMessage를 나타낸다. [설명자료](https://docs.streamlit.io/library/api-reference/chat/st.chat_message)

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240228174057.png)

role은  `user`, `assistant`, `ai`, `human` 등으로 나눌 수 있음
content는 그 안에 들어가는 내용이다.

### 반복 Loop

Streamlit에서 Main()함수는 내부적으로 구현되어 있어서 순차적으로 실행되는 전통적인 방식이랑 헷갈리는 부분이 있다.
쉽게 이해하려면 지금까지는 셋팅이고 아래 부분이 `메세지 Loop`으로 생각하면 될 듯하다.

```python
if prompt := st.chat_input("What is up?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        stream = client.chat.completions.create(
            model=st.session_state["openai_model"],
            messages=[
                {"role": m["role"], "content": m["content"]}
                for m in st.session_state.messages
            ],
            stream=True,
        )
        response = st.write_stream(stream)

        
    st.session_state.messages.append({"role": "assistant", "content": response})
```

- `if prompt := st.chat_input("What is up?"):` 
  - 만약 `prompt`가 있으면 prompt는 `st.chat_input("What is up?")` 결과로 할당

> 사용자가 입력을 한다면

- `st.session_state.messages.append({"role": "user", "content": prompt})`
  - 채팅관리에 `User`가 `Content`를 했다고 추가
  - 형식은 `Dict`이다.

- `with st.chat_message("user"): \ st.markdown(prompt)`
  - 채팅화면 맨 아래에다가 내용을 추가

> Assistant가 답을 한다면

- `stream = client.chat.completions.create( ~~~~`
  - LLM에게 Completions 형태로 넘기는데, messages에 이전까지의 모든 Message를 다 넘김

```python
messages=[
    {"role": m["role"], "content": m["content"]}
    for m in st.session_state.messages
]
```

위는 `Python list comprehension`인데 따로 공부를 해야함. 쉽게 말해 `st.session_state.messages`의 `role`과 `content`을 Dict(JSON)형태로 만들어 다 때려 넣음

- `response = st.write_stream(stream)`
  - 응답에 대해서는 `Stream`형식으로 출력할 것.. 쭐쭐쭐... 질질질.... 

> 응답이 다 나오면

응답의 결과를 `Assistant`가 한 것으로 해서 Message History에 넣을 것

## 결론 & Next Step

- Code상에 `Message History` 제한이 없기 때문에 대화가 길어지면 다수의 `Tokens`가 사용될 수 있다.
- StreamLit Coding은 Configuration을 만든다고 생각하면 받아 들이기 쉽다.
- `StreamLit`를 Python 고유의 문법을 많이 쓰니까 익숙하지 않으면 이해하기 힘들 수 있다.

### Next Step

- LangChain이나 Custom Tools와 연계시켜보자.
- History를 줄일 수 있는 방법을 연구해보자.