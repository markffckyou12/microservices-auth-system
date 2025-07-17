import { useParams } from 'react-router-dom';
import UserDetailComponent from '../components/UserDetail';

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  return <UserDetailComponent userId={userId!} />;
};

export default UserDetail; 