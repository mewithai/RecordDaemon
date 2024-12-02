---
excerpt: "Markdown을 ChromaDB에 넣고 LangChain Retriever를 만들어보자. "
toc: true
toc_sticky: true
toc_label: "Markdown Retriever"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
---

## 배경과 목표

- 내 `Second Brain`은 `Markdown`으로 되어 있고 이를 `LLM Agent`와 연결하면 시너지가 높다. 그래서 Langchain의 Retriever를 보는데..
- Langchain 문서는 그냥 어렵다. 봐도 잘 모르겠어서 내 방법으로 해석이 필요하다.
- `Markdown`을 잘 `Split`하여서 `Chroma DB`에 넣고 Langchain에 연결해서 `RAG`를 만들 준비를 하자.

## Code의 출처

기본 코드는 다음의 [chat_with_documents Code](https://github.com/langchain-ai/streamlit-agent/blob/main/streamlit_agent/chat_with_documents.py)를 활용하였다.

## ChromaDB 연계 코드

원본 코드가 생소하고 복잡해서 `Wrapper` 따로 하나 만들었다.

같은 단어들이 너무 반복되어서 어느 Class에서 온 것인지 헷갈려서 차근차근 하나씩 봤다.

```python
import chromadb
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import MarkdownHeaderTextSplitter
from langchain_openai import OpenAIEmbeddings
## Load Config
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

class JSMarkdownWarraper():
    def __init__(self):
       # print(os.getenv("OPENAI_API_KEY"))        
        self.embedding_fn = OpenAIEmbeddings()
        self.chroma_client = chromadb.PersistentClient(path=".rag_db")
        self.langchain_client = Chroma(embedding_function=self.embedding_fn, client=self.chroma_client, collection_name="js_collection")

    def readFromMarkdown(self, filename):
        with open(filename, 'r', encoding='utf-8') as file:
            markdown_content = file.read()
        
        headers_to_split_on = [("#", "H1"), ("##", "H2"), ("###", "H3")]

        splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        splitted_result = splitter.split_text(markdown_content)
        print(splitted_result)
        return splitted_result
    
    def saveIntoVectorDB(self, splitted_document):

         self.langchain_client.from_documents(
             documents=splitted_document,
             embedding=self.embedding_fn,
             client=self.chroma_client,
             collection_name="js_collection")  ## Collection_name을 꼭 넣어야한다.

    def peek(self):
       # print("There are", self.langchain_client.get())
        print("There are", self.langchain_client.get(include=['embeddings', 'documents', 'metadatas']))

    def getRetriever(self):
        retriever = self.langchain_client.as_retriever(search_type="mmr", search_kwargs={"k": 2, "fetch_k": 4})
        return retriever

## 테스트용
if __name__ == "__main__":

    a = JSMarkdownWarraper()
    docu = a.readFromMarkdown("markdown002.md")
    a.saveIntoVectorDB(docu)
    a.peek()
#    a.getRetriever()
```

### `__init__` 관련

- ChromaDB를 생성하고 Client를 선언했다.
- Embedding Function은 OpenAI API를 썼다.
- Chroma DB에 접근하기 위해서 Client를 생성 : `self.chroma_client`
  - 생성자로 들어간 Path는 내용이 저장될 `path` 이다.
  - 여기의 `chromadb`는 `import chromadb`의 `chromadb`이다. 헷갈리지 말자.
- Langchain에 접근하기 위해서 Client를 생성 : `self.langchain_client`
  - 정확한 역활은 `langchan chromadb client`이다
  - 여기의 `Chroma`는 `from langchain_community.vectorstores import Chroma`의 `Chroma`이다
  - 생성자로 `chromadb_client`를 넣는다.
  - Chorma의 Reference 문서: [langchain_community.vectorstores.chroma.Chroma](https://api.python.langchain.com/en/latest/vectorstores/langchain_community.vectorstores.chroma.Chroma.html)

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240306222245.png)

- Chroma DB안에서 Table에 해당하는 Collection은 `js_collection`으로 줬다.
  - **중요!** Insert할 때 꼭 줘야한다.

```python
    def __init__(self):
        self.embedding_fn = OpenAIEmbeddings()
        self.chroma_client = chromadb.PersistentClient(path=".rag_db")
        self.langchain_client = Chroma(embedding_function=self.embedding_fn, client=self.chroma_client, collection_name="js_collection")
```

### Markdown file 읽기

- Markdown 파일 읽기에는 큰 무리가 없다.
- splitter를 할때 `#, ##, ###`로 하라고 줬다. H1, H2, H3의 MetaInfo를 바꿔도 좋다.
- Return으로 `splitted_result`는 Langchain Document의 List이다.
  - 참고: [`langchain_text_splitters.markdown.MarkdownHeaderTextSplitter`](https://api.python.langchain.com/en/latest/markdown/langchain_text_splitters.markdown.MarkdownHeaderTextSplitter.html#langchain_text_splitters.markdown.MarkdownHeaderTextSplitter)
  - 위 Class의 `split_text()`의 Return은 `List[Document]`이다.
  - Langchain Document : [langchain_core.documents.base.Document](https://api.python.langchain.com/en/latest/documents/langchain_core.documents.base.Document.html#langchain_core.documents.base.Document)

```python
    def readFromMarkdown(self, filename):
        with open(filename, 'r', encoding='utf-8') as file:
            markdown_content = file.read()
        
        headers_to_split_on = [("#", "H1"), ("##", "H2"), ("###", "H3")]

        splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        splitted_result = splitter.split_text(markdown_content)
        print(splitted_result)
        return splitted_result
```

### ChromaDB로 넣기

- `chromadb`로 넣을때는 langchain의 Chroma Class의 `from_documents`를 썼다.
- `return`으로 `Chroma`를 인데 생성자로 `self.langchain_client`가 있어서 필요없다.
  - 이 부분을 이해하는데 많이 헷갈렸다.
  - chroma client를 이용해서 DB에 넣기 때문에 `collection_name`이 꼭 들어가야 한다.
- `langchain_client`의 객체 이용시 생성자에서 `embedding`과 `chroma client`, `collection_name`을 줬으니까 안 줘도 되지 않냐는 것이 내 생각인데, 안 주었다가 데이터가 안들어가서 헤메였다.
- `from_documents`가 `Chroma`를 Return하니까 또 더 헷갈리는 듯 하다.
- **참고로 난 개발자가 아니다. 내가 편해질려고 Agent를 만들고 일을 시키고 싶은 사람일 뿐이다. 개발자는 쉬울려나?**

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240306224655.png)

```python
    def saveIntoVectorDB(self, splitted_document):

         self.langchain_client.from_documents(
             documents=splitted_document,
             embedding=self.embedding_fn,
             client=self.chroma_client,
             collection_name="js_collection")

# 객체없이 바로 Method를 불러다 써도 된다.         
#        Chroma.from_documents(documents=splitted_document,
#                              embedding=self.embedding_fn,
#                              client=self.chroma_client ,
#                              collection_name="js_collection") ## Collection_name을 꼭 넣어야한다.
```

### Retriever 리턴받기

- `mmr` 방식과 `k=2`, `fetch_k=4`를 썼다.
- [maximal marginal relevance (MMR)](https://python.langchain.com/docs/modules/model_io/prompts/example_selector_types/mmr)
- `mmr`에서 `fetch_k`와 `k`에 대해서는 따로 정리 필요

```python
    def getRetriever(self):
        retriever = self.langchain_client.as_retriever(search_type="mmr", search_kwargs={"k": 2, "fetch_k": 4})
        return retriever
```

### DB 조회해보기

- `self.langchain_client.get()`으로 조회해볼 수 있는데 `embedding vector`가 `[none]`으로 나온다. 
  - 참고: [Chroma database embeddings none when using get](https://stackoverflow.com/questions/76482987/chroma-database-embeddings-none-when-using-get)
- 너무 많이 나와서 그런 것이니 아래 2줄을 적당한 것을 선택 활용하자.

```python
   def peek(self):
       # print("There are", self.langchain_client.get())
        print("There are", self.langchain_client.get(include=['embeddings', 'documents', 'metadatas']))
```

## 결론 및 Next Step

- ChromaDB를 기반으로 Markdown의 Retriever를 만들어 보았다.
- `Chain`으로 연결하였을 때 정상 동작함도 확인하였다.
- `langchain`과 `python`은 어렵다.

### Next Step

- StreamLit + LangChain + ChromaDB로 RAG 만들기
  - My Second Brain 내용으로 `Second Brain Search Assistant`를 만들어 보자.