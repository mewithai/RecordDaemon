---
title: "LangChain Tool과 StructedTool에 대한 설명 및 이해"
last_modified_at: 2024-03-24 13:00:00 
excerpt: "Tool과 StructedTool에는 어떤 차이점이 있을까?"
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
permalink: /langchain/LangChain-Tool-and-StructedTool/
---

## 배경 및 목적

LangChain으로 Custom Toos를 만들다 보니 `Tool`도 나오고 `StructedTool`도 나오는데, 이 둘의 차이점이 무엇인지 궁금해졌다.

### 목표

Tool과 StructedTool의 차이점을 이해하기

## Tool과 StructedTool

공식문서 [langchain_core.tools](https://api.python.langchain.com/en/latest/core_api_reference.html#module-langchain_core.tools)에는 Tool과 StructedTool에 차이에 대해서 아래와 같이 정의 하고 있다.

- `Tool`: Tool that takes in function or coroutine directly.
- `StructedTool`: Tool that can operate on any number of inputs.

설명상으로는 `Tool`은 함수와 연관된 것이고 `StructedTool`은 여러개의 입력을 할 수 있단다.. 뭔말인지.. ChatGPT는 아래와 같이 답변하였다.

> While generic LangChain `tools` provide a broad range of functionalities to interact with language models, `StructuredTools` specialize in offering a structured and detailed interface for complex and multi-faceted interactions within the LangChain framework.

- ChatGPT가 알려준 참고 Site
  - [Structured Tools](https://blog.langchain.dev/structured-tools/)
    - While previous tools took in a single string input, new tools can take in an arbitrary number of inputs of arbitrary types
    - `StructuredTools` are designed to handle more complex interactions with the model, such as multi-turn conversations or more complex data processing tasks.

보니까, LangChain에서 처음에는 `langchain_core.tools.Tool`을 만들어 쓰다가 입력이나 출력 등을 좀 더 세부적으로 조정하고 Agent와 연결을 위해서 `langchain_core.tools.StructedTool`을 만들었다고 이해하면 되겠다.

## 결론

잘 모르겠으니까 일단, `StructedTool`을 사용하자. 심심하면 위 [LangChain블로그](https://blog.langchain.dev/structured-tools/)를 읽어보자.
