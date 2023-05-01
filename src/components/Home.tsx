import React, { useState } from 'react';
import { Breadcrumb, Button, Input, Layout, Space, theme } from 'antd';
import { useDispatch } from 'react-redux';
import Link from 'antd/es/typography/Link';
import * as dotenv from 'dotenv'
import issuesSlice, { issues } from '../redux/issues';
dotenv.config()

const { Header, Content, Footer } = Layout;

type DataType = {
  state: string;
  assignee?: null | string;
}

type ColumnType = {
  id: string;
  title: string;
};

type IssueRequestType = {
  id: number;
  number: number;
  column: string;
  title: string;
  state: string;
  assignee: string | null;
}

type IssueType = {
  id: number;
  number: number;
  column: string;
  title: string;
}

const Home = () => {
  const [text, setText] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [ownerLink, setOwnerLink] = useState<string>('');
  const [repoLink, setRepoLink] = useState<string>('');
  const [allIssues, setAllIssues] = useState<IssueType[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const accessToken = process.env.REACT_APP_ACCESS_TOKEN

  const dispatch = useDispatch()

  const columns: ColumnType[] = [
    { id: 'ToDo', title: 'ToDo' },
    { id: 'InProgress', title: 'In Progress' },
    { id: 'Done', title: 'Done' },
  ];

  const fetchApi = async (issueNumber:number, data:DataType) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/`;
    const response = await fetch(url + issueNumber, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...data
        })
      });
      if (!response.ok) {
        console.error(response.statusText);
        return;
      }
  }

  const getIssues = async (repoUrl: string) => {
    setText('');
    const urlParts = repoUrl.split('/');
    const owner = urlParts[3];
    const repo = urlParts[4];
    setOwner(owner);
    setRepo(repo);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all`);
    const issues = await response.json();
    const allIssues = issues.map((item:IssueRequestType, index:number) => {
      return {id: index, title: item.title, number: item.number, column: item.state === "open" && !!!item.assignee? "ToDo": item.state === "open" && !!item.assignee === true? "InProgress": "Done"}
    })
    dispatch(issuesSlice.actions.issues(allIssues))
    setAllIssues(allIssues)
    const linkForOwner = issues[0].user.html_url
    setOwnerLink(linkForOwner)
    const linkForRepo = text;
    setRepoLink(linkForRepo)
    return issues;
  }

  const [draggedItem, setDraggedItem] = useState<IssueType | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: IssueType) => {
    setIsDragging(true);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };
  
const handleDragOver = async (e: React.DragEvent<HTMLDivElement>, columnId: string, index: number) => {
  e.preventDefault();
  if (draggedItem === null) {
    return;
  }
  if (draggedItem.column === columnId) {
    const updatedItems = [...allIssues];
    updatedItems.splice(updatedItems.indexOf(draggedItem), 1);
    updatedItems.splice(index, 0, draggedItem);
    setAllIssues(updatedItems); 
  } 
  else {  
    const updatedItems = allIssues.map((item) =>
      item.id === draggedItem.id ? { ...item, column: columnId } : item
    );
    const columnItems = updatedItems.filter(item => item.column === columnId);
      if (columnItems.length === 0) {
        updatedItems.push({ ...draggedItem, column: columnId });
      }
      setAllIssues(updatedItems);
  }
  };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
      e.preventDefault();
      if (draggedItem === null) {
        return;
      }
    
      const updatedItems = allIssues.map((item) =>
        item.id === draggedItem.id ? { ...item, column: columnId } : item
      );
      const columnItems = updatedItems.filter(item => item.column === columnId);
      if (columnItems.length === 0) {
        updatedItems.push({ ...draggedItem, column: columnId });
      }
      if (draggedItem.column && columnId === "Done") {
        fetchApi(draggedItem.number, {
          state: "closed"
        })
        }
        if (draggedItem.column && columnId === "ToDo") {
          fetchApi(draggedItem.number, {
            state: "open",
            assignee: null
          })
          }
          if (draggedItem.column && columnId === "InProgress") {
            fetchApi(draggedItem.number, {
              state: "open",
              assignee: owner
            })
            }
      setAllIssues(updatedItems);
    };

  return (
    <Layout>
    <Header>
      <div className='logo'>
        <h1>GitHub Kanban Board</h1>
      </div>
    </Header>
    <Content className="site-layout" style={{ padding: '0 50px' }}>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><Link href={ownerLink}>{owner}</Link></Breadcrumb.Item>
        <Breadcrumb.Item><Link href={repoLink}>{repo}</Link></Breadcrumb.Item>
      </Breadcrumb>
      <div className='layout'>
      <Space.Compact style={{ width: '100%' }}>
      <Input 
        autoFocus
        id='link'
        type={"text"}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        defaultValue="Combine input and button" 
        placeholder='Enter the link to the repo'
      />
      <Button onClick={() => getIssues(text)} type="primary">Load issues</Button>
    </Space.Compact>
    <br/>
    <br/>
    <div className="kanban-board">
      {columns.map((column, index) => (
        <div key={column.id} className="kanban-column">
          <h2>{column.title}</h2>
          <div
            className="kanban-dropzone"
            onDragOver={(e) => handleDragOver(e, column.id, index)}
            onDrop={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            {allIssues
              .filter((item:IssueType) => item.column === column.id)
              .map((item:IssueType) => (
                <div
                  key={item.id}
                  className="kanban-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={() => setDraggedItem(null)}
                  onDrop={(e) => handleDrop(e, item.column)}
                >
                  {item.title}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
    </div>
    </Content>
    <Footer style={{ textAlign: 'center' }}>Ant Design ©2023 Created by Filatov Danylo</Footer>
  </Layout>

  );
}
export default Home;
