import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { findEvent } from '../../service/EventsService.js';
import { updateUser, findUsers, findUser, deleteUser } from '../../service/UsersService.js';
import { HOME_URL } from '../../util/System.js';

import { Panel } from '../ui/Interface.js';
import { useToast } from '../ui/Toast.js';
import Load from '../ui/Load.js'
import Grid from './Grid.js';
import Icon from '../ui/Icon.js';

/*
  Calendar component
    - makes api calls to server to retrieve event information
    - users can sign into edit their availability using the grid component
*/
const Calendar = () => {
  const { id } = useParams();

  // event info
  const [eventInfo, setEventInfo] = useState({ loading: true }); // event name and date
  const [users, setUsers] = useState(null);
  const counts = useMemo(() => {
    let _counts = { max: users?.length };
    users?.forEach((u) => {
      u.selected?.forEach((dateID) => {
        if(!_counts[dateID]) _counts[dateID] = { amount: 0, users: []};
        _counts[dateID].amount = _counts[dateID].amount + 1;
        _counts[dateID].users = [..._counts[dateID].users, u.user];
      });
    });
    return _counts;
  }, [users]);

  // user info
  const [user, setUser] = useState(""); // user name
  const [selected, setSelected] = useState(new Set()); // current user's date availability
  const selectedCounts = useMemo(() => {
    const _counts = { max: 1 };
    selected.forEach((dateID) => {
      _counts[dateID] = { amount : 1, users: [] };
    });
    return _counts;
  }, [selected]);

  // status
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useToast();

  // replace bad but passable URLs
  useEffect(() => {
    window.history.replaceState(null, "Avail", HOME_URL + "/" + id);
  }, [id])

  // retreive event and user availability from server
  useEffect(() => {
    const fetchEvent = async() => {
      const eventResponse = await findEvent(id)
      setEventInfo(eventResponse?.data);
      if(!eventResponse?.data) return;
      document.title = eventResponse?.data.name
    }

    const fetchUsers = async () => {
      const usersResponse = await findUsers(id)
      setUsers(usersResponse?.data);
    };

    fetchEvent();
    fetchUsers();
  }, [id]);

  // returns date strings based on date object values from the server
  const getDateStrings = () => {
    return eventInfo?.dates.map((d) => {
      const _date = new Date(d);
      return (_date.getUTCMonth() + 1) + "/" + _date.getUTCDate();
    })
  }
  
  // saves users name as it is inputted
  const handleUserChange = (event) => {
    setUser(event.target.value);
  }

  /*
    selection function passed to grid component
      - {id}  : {month/day-time} string id from grid cell
      - {type} : if type is specified, perform that action, otherwise do opposite action (i.e select/deselect)
  */
  const handleSelect = (id, type) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if(type) {
        if(type === "add") next.add(id);
        if(type === "delete") next.delete(id);
        return next;
      }

      if(prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // upon signing in, get current user's availibility
  const handleSignIn = async () => {
    const response = await findUser({ id, user });
    setSelected(new Set(response?.data?.selected));
    setSignedIn(true);
  }

  /*
    performs an action based on current user's selection
      - if selection is empty, delete user from databasde
      - otherwise, update selection in the database
      - then recallculate availability counts
  */
  const handleSave = async () => {
    const selectedArray = Array.from(selected);
    const event = { id, user, selected: selectedArray };

    
    if(selectedArray.length === 0) {
      await deleteUser(event)
    } else {
      await updateUser(event);
    }
    
    const usersResponse = await findUsers(id)
    setUsers(usersResponse?.data);
    setEditing(false);
  }
  
  const handleCopy = () => {
    navigator?.clipboard?.writeText(HOME_URL + "/" + id);
    setToast("Đã sao chép liên kết vào khay nhớ tạm. Hãy chia sẻ nó với mọi người.")
  }

  // default loading screen to show 
  if(eventInfo?.loading) {
    return <Load/>
  }

  // if no event is found, show message
  if(!eventInfo) {
    return (
      <Panel className="calendar center-self flex-col">
        <label className="center-text large bold "> Sự kiện không tồn tại </label>
        <label className="center-text large"> Bạn có liên kết phù hợp? </label>
      </Panel>
    )
  }

  // otherwise show calendar
  return (
    <>
      {toast}
      <Panel className="calendar center-self flex-col">
        <div className="flex-col">
          <label className="medium"> {eventInfo?.name} </label>
          <label className="small"> Mời mọi người bằng cách gửi cho họ liên kết đến trang này. </label>
          <label className="small"> Click vào ô bên dưới để sao chép liên kết </label>
          <label className="small link" title="Copy link to clipboard" onClick={handleCopy}> {id} <Icon type="clipboard"/> </label>
        </div>

        { editing ? (
            <Grid dates={getDateStrings()} counts={selectedCounts} onSelect={handleSelect} editing={editing}/>
          ) : (
            <Grid dates={getDateStrings()} counts={counts}/>
          )
        }
        
        { !signedIn &&
          <div className="flex-col">
            <label className="medium"> Tên của bạn </label>
            <input type="text" value={user} onChange={handleUserChange} pattern="([A-z0-9À-ž\s]){2,}"/>
            <button disabled={user.trim().length === 0} onClick={handleSignIn}> Đăng nhập để thực hiện thay đổi </button>
          </div>
        }

        { (signedIn && !editing) && <button onClick={setEditing}> Chỉnh sửa </button> }
        { editing && <button onClick={handleSave}> Lưu thay đổi </button> }
      </Panel>
    </>
  )
}

export default Calendar;