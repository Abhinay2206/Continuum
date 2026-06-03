from langchain_text_splitters import RecursiveCharacterTextSplitter, Language
import hashlib

class ChunkingService:
    def __init__(self):
        # We define a mapping from our internal languages to LangChain's Language enum
        self.language_mapping = {
            'python': Language.PYTHON,
            'javascript': Language.JS,
            'typescript': Language.TS,
            'java': Language.JAVA,
            'go': Language.GO,
            'rust': Language.RUST,
            'cpp': Language.CPP,
            'c': Language.CPP,
            'csharp': Language.CSHARP,
            'ruby': Language.RUBY,
            'php': Language.PHP,
            'html': Language.HTML,
            'markdown': Language.MARKDOWN,
        }
        
        self.default_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )

    def _get_splitter_for_language(self, language: str):
        lc_lang = self.language_mapping.get(language)
        if lc_lang:
            return RecursiveCharacterTextSplitter.from_language(
                language=lc_lang,
                chunk_size=1000,
                chunk_overlap=200
            )
        return self.default_splitter

    def chunk_repository_files(self, repo_id: str, files_data: list[dict]) -> list[dict]:
        chunks = []
        
        for file_info in files_data:
            content = file_info['content']
            language = file_info['language']
            file_path = file_info['filePath']
            
            splitter = self._get_splitter_for_language(language)
            text_chunks = splitter.split_text(content)
            
            for i, chunk_text in enumerate(text_chunks):
                # Create a deterministic chunk ID
                chunk_hash = hashlib.md5(f"{repo_id}:{file_path}:{i}".encode()).hexdigest()
                chunk_id = f"{repo_id}_{chunk_hash[:10]}"
                
                chunks.append({
                    "chunkId": chunk_id,
                    "repoId": repo_id,
                    "filePath": file_path,
                    "language": language,
                    "chunk": chunk_text
                })
                
        return chunks

chunking_service = ChunkingService()
