# docker-dev.md

## docker 中下载 mysql

docker pull mysql

#启动
docker run -d --name mysql-server -p 3306:3306 -e MYSQL_ROOT_PASSWORD=Mq123 mysql

#登录mysql
mysql -u root -p

CREATE DATABASE mall_api;

CREATE USER 'mall_api'@'%' IDENTIFIED BY 'Mq123';