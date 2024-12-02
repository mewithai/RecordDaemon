---
title: "LangChain OpenAI Custom Tools"
excerpt: "LangChain Agent Custom Tools을 사용하는 방법에 대한 고찰"
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - AI Agent
permalink: /langchain/LangChain-OpenAI-Custom-Tools/
---

## 배경과 목표

업무 자동화를 위하여 LangChain의 Agent에게 일을 시킬려고함. 밥은 못사줘도 도구(`Tools`)라도 쥐어줘야죠. Tool이 어떻게 동작하는지 이해합시다.

- 관련문서: LangChain -> Modules -> Agent -> Tools -> Defining Custom TopologicalSorter
- [참고 Site: enhancing-langchain-agents-with-custom-tools](https://www.comet.com/site/blog/enhancing-langchain-agents-with-custom-tools/)

## 툴의 기본

- 이 POST 참고: [LangChain OpenAI Tools대한 이해](./2024-03-29-[01]_OpenAI%20Tools에%20대한%20이해.md)

## Tools을 만드는 방법

툴은 다음의 방법으로 만들 수 있음

1. `Tool.from_function()` 를 사용
1. `@Tool` Decorator를 사용
3. `BaseTool class`를 활용

Agent가 사용할 툴은 다음의 것들을 정의해두어야함.

- **name (str)** is required and must be unique within a set of tools provided to an agent
- **description (str)** is optional but recommended, as an agent uses it to determine tool use
- **return_direct (bool)**, defaults to False, 나온 것을 바로 답으로 쓸지 말지 결정
  - 일반적으로 LLM이 해석을 해서 답을 주는데 이걸 `True`로 하면 바로 답으로 사용됨
- **args_schema (Pydantic BaseModel)**, is optional but recommended and can be used to provide more information (e.g., few-shot examples) or validation for expected parameters.
  - 입력은 Pydantic 방식을 사용해서 정의해야함: [Pydantic](https://pydantic-docs.helpmanual.io/)
- 그리고 **function**을 정의해야함

위에 설명한 방법으로 Tool을 만들어 보자.

### Using the Tool dataclass

- from_function()으로 만드는 건 이미 있는 Funcion을 Tool의 형태로 만드는 것
- 인터넷에서 찾아서 결과를 주는 Tool을 만든다면
  - accept a single string input and return a string output

```python
from langchain.tools import BaseTool, StructuredTool, Tool, tool, DuckDuckGoSearchRun

duck_search = DuckDuckGoSearchRun()

search_tool = Tool.from_function(
    func=duck_search.run,
    name="Search",
    description="useful for when you need to search the internet for information"
)
```

- Tool의 이름은 `Search`
- Tool의 역활은 "useful for when you need to search the internet for information"
- 여기에서는 `args`가 없음

```
>>> search_tool
Tool(name='Search', description='useful for when you need to search the internet for information', func=<bound method BaseTool.run of DuckDuckGoSearchRun()>)

>>> search_tool.args
{'tool_input': {'type': 'string'}}

>>> search_tool
Tool(name='Search', description='useful for when you need to search the internet for information', func=<bound method BaseTool.run of DuckDuckGoSearchRun()>)
```

`search_tool`에서 미정의된 `args`는 어디로 간 것일까?

> The reason you're not seeing args listed in the output when you just query search_tool without specifically accessing its args property is due to how the object's `__repr__` method (or its equivalent in this context) is implemented. This method controls how the object is represented as a string (i.e., what gets shown when you print the object or inspect it in an interactive session). In this case, the implementation of `__repr__` for search_tool is designed to show only a high-level summary (name, description, and the bound method) rather than detailed information about its arguments.

- `__repr__`은 무엇일까? : 추가필요

- `Tool.from_fuction`은 Tool을 생성하는 함수
  - 이 툴은 `duck_search` 인스턴스의 `run`이라는 함수를 실행
  - `Input`과 `Output`에 대한 설명이 생략되어 있음

```log
> Entering new AgentExecutor chain...

I need to search for the Sacramento Kings win-loss record for the 2022-2023 season. Then I need to add the games won and games lost and multiply that result by 2.
Action: Search
Action Input: "Sacramento Kings win-loss record 2022-2023 season"
Observation: 어쩌고 저쩌고
```

**눈여겨 볼 것**: `args_schema`가 그냥 입력은 String, 출력도 String으로 하는 듯

### `@tool` Decorator

이전 예시는  `from_fuction`에 함수를 파라미터로 넣어서 만들었다면, 이번에는 함수를 선언하면서 `@tool Decorator`를 사용해서 이것이 LangChain Tool이라고 선언하는 방법이다.

- `@tool` 안에다가 원하는 파라미터를 넣을 수 있음
  - Ex) `@tool("lower_case", return_direct=True)`
- `@tool`은 `BaseTool`을 상속받은 클래스를 만들어준다.
- 함수의 첫줄은 `Docstring`으로 Tool의 Description에 해당한다.
  - `args_schema`에 대해서 `Description` 안에다가 써도 된다.

```python
from langchain.tools import tool

@tool("lower_case", return_direct=True)
def to_lower_case(input:str) -> str:
  """Returns the input as all lower case."""
  return input.lower()
```

만들고 실행해 보았음

```
>>> to_lower_case
StructuredTool(
  name='lower_case',
  description='lower_case(input: str) -> str - Returns the input as all lower case.', args_schema=<class 'pydantic.v1.main.lower_caseSchema'>,
  return_direct=True,
  func=<function to_lower_case at 0x7f822f4360>)
```

위의 예시와 다른 것은 앞선 애는 `Tool`이였는데 얘는 `StructuredTool`이다. **차이점 확인 필요**

아래는 IoT DB에서 Inspection이 필요한 Devices를 조회해서 가지고 오는 Tool을 샘플로 만들어 보았다.

```python
class IoTTools():
    @tool("get Devices which are not working")
    def get_Connected_Devices(server : str ) -> list:
        """Useful to get Devices which is not working for a certain time.
           These devices are needed to be checked and fixed.

           :input value: server, Blank is good by default
           :return value: list of tuple, (device name, ipaddress, last found date and time)
           """
        try:
            db = SlDbEngine()
            result = db.get_1H_Not_Working_Device()

            return f"Not working devices on are {result}."
        except Exception:
            return "Error with the input for the tool."
```

- `@tool`은 `name`에 해당된다.
- `Docstring`은 `description`에 해당된다.
- `input`과 `output`은 `args_schema`에 해당된다.
- 함수의 본 내요은 `func`에 해당된다.
- `return_direct`는 어디에 있을까?

### Subclassing from the BaseTool class

BaseTool class를 상속하면 좀 더 아름다운 툴이 나온다. Callback 함수도 넣을 수 있음
**이건 나중에 추가**

### Modifying existing tools

기존의 툴을 수정하려면 내부 member 변수로 접근해서 수정하면 된다. 

```python
WikipediaQueryRun(name='Wikipedia', description='A wrapper around Wikipedia. Useful for when you need to answer general questions about people, places, companies, facts, historical events, or other subjects. Input should be a search query.', args_schema=None, return_direct=False, verbose=False, callbacks=None, callback_manager=None, tags=None, metadata=None, handle_tool_error=False, api_wrapper=WikipediaAPIWrapper(wiki_client=<module 'wikipedia' from '/usr/local/lib/python3.10/dist-packages/wikipedia/__init__.py'>, top_k_results=3, lang='en', load_all_available_meta=False, doc_content_chars_max=4000))
```

- name, description, return_direcr와 같은 기본적인 애들을 바꿔서 쓰면 된다.
- 이중에서 `description`를 수정해서 쓰는 것이 대부분일 듯

## 결론과 Next Step

LangChain에서 Agent가 사용하는 `Tools`에 대해서 알아 보고 개념을 이해하였다.

### Next Step

- LangSmith로 LangChain이 들아가는 과정을 분석해보기
- Python Decorator 정리해두기
- Subclassing from the BaseTool class 정리 하기
- 비동기방식의 Tool의 구동 과정 이해하기