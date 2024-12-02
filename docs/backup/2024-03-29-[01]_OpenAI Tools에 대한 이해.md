---
title: "LangChain OpenAI Tools대한 이해"
last_modified_at: 2024-03-24 13:00:00 
excerpt: "LangChain에서 OpenAI Tools에 대해서 설명하고 예시를 정리하자."
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
permalink: /langchain/LangChain-OpenAI-Tools/
---

## 배경 및 목표

LangChain에서 OpenAI Tools를 어떻게 사용할지에 대해서 정리하자.

### 목표

- OpenAI Tools에 대해서 완벽하게 이해하기

## OpenAI functions and Tools

> OpenAI API has deprecated functions in favor of tools. The difference between the two is that the tools API allows the model to request that multiple functions be invoked at once, which can reduce response times in some architectures. It’s recommended to use the tools agent for OpenAI models.

라고 공식문서에 나와있다.

### Difference with OpenAI functions and Tools

- `tools`는 모델이 한 번에 여러 함수를 호출하도록 요청할 수 있게 줌
- 이로 인해서 전반적으로 응답시간 개선될 수 있다. 
- Agent에서 호출할려면 Tools를 써야한다.
- 참고 Site
  - [Tools](https://python.langchain.com/docs/modules/agents/tools/)
  - [OpenAI Tools](https://python.langchain.com/docs/modules/agents/agent_types/openai_tools)
  - [OpenAI chat create](https://platform.openai.com/docs/api-reference/chat/create)
  - [OpenAI function calling](https://platform.openai.com/docs/guides/function-calling)
  - [What's the difference between Langchain Agents and OpenAI Functions?](https://mikulskibartosz.name/difference-between-langchain-agents-and-openai-functions)

## Tools

Tools are interfaces that an agent can use to interact with the world.

### 구성요소

- The name of the tool
- A description of what the tool is
- JSON schema of what the inputs to the tool are
- The function to call
- Whether the result of a tool should be returned directly to the user

가능하면 위의 정보를 모두 기술해두는 것이 `Action-taking systems`에서 추론을 하는 데 유리하다. 툴이 어떤 정보를 받아 들이고 어떻게 동작하는 지를 최대한 명확하게 기술해야한다.

## Code Sample

### Default Tools

```python
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
```

Initialize the tool

```python
api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=100)
tool = WikipediaQueryRun(api_wrapper=api_wrapper)
```

만들어진 tool에 어떤 정보가 들어가 있는지 보자.

```python
tool.name = 'Wikipedia'
tool.description = 'A wrapper around Wikipedia. Useful for when you need to answer general questions about people, places, companies, facts, historical events, or other subjects. Input should be a search query.'
tool.args = {'query': {'title': 'Query', 'type': 'string'}}
tool.return_direct = False
```

다음과 같이 실행가능

```python
tool.run({"query": "langchain"})

'Page: LangChain\nSummary: LangChain is a framework designed to simplify the creation of applications '
```

### Customizing Default Tools

이전 툴에서 Description을 바꾸고 싶다면 Tool의 기본 파라미터를 바꿔주면 된다.
아래는 `tool.args`를 바꿔서 입력되는 데이터의 형태를 바꾸는 것이다. 기존의 `tool.args = {'query': {'title': 'Query', 'type': 'string'}}`을 바꾸어 준다. 

```python
from langchain_core.pydantic_v1 import BaseModel, Field

class WikiInputs(BaseModel):
    """Inputs to the wikipedia tool."""

    query: str = Field(
        description="query to look up in Wikipedia, should be 3 or less words"
    )
```

툴의 정의

```python
tool_before = WikipediaQueryRun(
    api_wrapper=api_wrapper
)


tool_after = WikipediaQueryRun(
    args_schema=WikiInputs,   # 요기가 추가
    api_wrapper=api_wrapper 
)
```

이전의 Tool과 비교해보자.

```python
>>> tool_before.args
{'query': {'title': 'Query', 'type': 'string'}}

>>> tool_after.args
{'query': {'title': 'Query', 'description': 'query to look up in Wikipedia, should be 3 or less words', 'type': 'string'}}
```

BaseModel을 사용해서 `args`에다가 Description을 추가해주었다. 이렇게 Description이 추가되면 Agent가 조금더 쉽게 Tool의 Input을 만들어 낼 것으로 기대한다.

아래는 수정된 Tool의 전체이다.

```
>>> tool_after
WikipediaQueryRun(
     name='wiki-tool',
     description='look up things in wikipedia',
     args_schema=<class '__main__.WikiInputs'>,
     return_direct=True,
     api_wrapper=WikipediaAPIWrapper(wiki_client=<module 'wikipedia' from '/home/JSToolsLC/lib/python3.11/site-packages/wikipedia/__init__.py'>, top_k_results=1, lang='en', load_all_available_meta=False, doc_content_chars_max=100)
     )
```

## 결론

- OpenAI Tools를 만들때 필요한 설명 정보들을 잘 기억하자. 5개가 필요하다.
  - `The name`, `Description`, `JSON schema of inputs`, `작업에 대한 것`, `Direct return 여부`
- Tools는 Agent가 세계와 상호작용할 수 있는 인터페이스이다.
- [의문점] 왜 Output에 대해서는 설명을 하지 않을까?

### NextStep

- 이전에 만든 Custom Tools를 조금 더 살펴보자.
- 왜 Output에 대해서는 설명을 하지 않는지에 대해서 조금 더 알아보자.

## 참고 Site

- [LangChain 공식문서 OpenAI Tools](https://python.langchain.com/docs/modules/model_io/output_parsers/types/openai_tools)

